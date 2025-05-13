from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch
import os
import json
import logging
import traceback # For detailed error logging
from accelerate import Accelerator

# Configure basic logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# --- Model Loading ---
try:
    accelerator = Accelerator()
    base_model_path = os.environ.get("MODEL_BASE_PATH", "/home/anurag_mishra/models/base_model") # Default path for Docker
    lora_model_path = os.environ.get("LORA_MODEL_PATH", "/home/anurag_mishra/models/recipe_model_lora_full/final_adapter") # Default path for Docker
    
    app.logger.info(f"Attempting to load tokenizer from: {base_model_path}")
    tokenizer = AutoTokenizer.from_pretrained(base_model_path)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        app.logger.info("Set tokenizer.pad_token to tokenizer.eos_token")

    app.logger.info(f"Attempting to load base model from: {base_model_path}")
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_path, 
        # device_map="auto", 
        torch_dtype=torch.float16 # Using float16 for efficiency
    )
    app.logger.info("Base model loaded successfully.")

    app.logger.info(f"Attempting to load LoRA adapter from: {lora_model_path}")
    lora_model = PeftModel.from_pretrained(base_model, lora_model_path)
    app.logger.info("LoRA adapter loaded successfully.")

    lora_model.eval()
    app.logger.info("Model set to evaluation mode.")

except Exception as e:
    app.logger.error(f"FATAL: Error during model loading: {e}")
    app.logger.error(traceback.format_exc())
    # If model loading fails, the app shouldn't start or handle requests properly.
    # Depending on deployment, this might cause container to exit or health checks to fail.
    # For simplicity here, we log and let it proceed, but requests will likely fail.
    lora_model = None 
    tokenizer = None
    app.logger.error("Model loading failed. The /generate_recipe endpoint will not function correctly.")


def parse_model_response_to_json(raw_response_text: str, user_query: str) -> dict:
    app.logger.info(f"Raw model response to parse: {raw_response_text[:500]}...") # Log first 500 chars

    # This parser needs to be robust. The quality of UX depends heavily on it.
    # Ideally, the model is fine-tuned to output JSON directly.
    # If not, this parser attempts to extract structured data.

    output = {
        "recipeName": "N/A",
        "ingredients": "N/A",
        "instructions": "N/A",
        "totalCalories": 0,
        "botMessage": None
    }

    try:
        # Attempt 1: Look for JSON block if model is tuned for it (optimistic)
        json_start = raw_response_text.find('{')
        json_end = raw_response_text.rfind('}')
        if json_start != -1 and json_end != -1 and json_end > json_start:
            try:
                potential_json = raw_response_text[json_start : json_end+1]
                parsed = json.loads(potential_json)
                # Check for key fields
                if "recipeName" in parsed and "ingredients" in parsed and "instructions" in parsed and "totalCalories" in parsed:
                    output.update(parsed)
                    app.logger.info("Successfully parsed model output as JSON block.")
                    return output
            except json.JSONDecodeError:
                app.logger.warning("Found JSON-like block, but failed to parse. Falling back to keyword parsing.")

        # Attempt 2: Keyword-based parsing (more brittle)
        current_section = None
        recipe_name_found = False
        ingredients_list = []
        instructions_list = []

        lines = raw_response_text.strip().split('\n')
        for line in lines:
            line_lower = line.lower().strip()

            if line_lower.startswith("recipename:"):
                output["recipeName"] = line.split(":", 1)[1].strip()
                recipe_name_found = True
                current_section = "name"
            elif line_lower.startswith("ingredients:"):
                current_section = "ingredients"
                # Capture text on the same line if any
                ing_text = line.split(":", 1)[1].strip()
                if ing_text: ingredients_list.append(ing_text)
            elif line_lower.startswith("instructions:"):
                current_section = "instructions"
                inst_text = line.split(":", 1)[1].strip()
                if inst_text: instructions_list.append(inst_text)
            elif line_lower.startswith("totalcalories:") or line_lower.startswith("calories:"):
                current_section = "calories"
                try:
                    cal_str = "".join(filter(str.isdigit, line.split(":",1)[1].strip() if ":" in line else line))
                    if cal_str:
                        output["totalCalories"] = int(cal_str)
                except ValueError:
                    app.logger.warning(f"Could not parse calories from line: {line}")
            elif line_lower.startswith("botmessage:"):
                current_section = "botmessage"
                output["botMessage"] = line.split(":", 1)[1].strip()
            elif line.strip(): # Non-empty line
                if current_section == "ingredients" and not line_lower.startswith(("recipename:", "instructions:", "totalcalories:", "calories:", "botmessage:")) :
                    ingredients_list.append(line.strip())
                elif current_section == "instructions" and not line_lower.startswith(("recipename:", "ingredients:", "totalcalories:", "calories:", "botmessage:")) :
                    instructions_list.append(line.strip())
        
        if ingredients_list:
            output["ingredients"] = "\n".join(ingredients_list)
        if instructions_list:
            output["instructions"] = "\n".join(instructions_list)

        # If no recipe details found, assume it's a general bot message.
        if not recipe_name_found and (not ingredients_list or output["ingredients"] == "N/A") and (not instructions_list or output["instructions"] == "N/A"):
            if not output["botMessage"]: # If no explicit botMessage, use the whole raw response
                 output["botMessage"] = raw_response_text.strip() if raw_response_text.strip() else "I'm sorry, I couldn't find a specific recipe for that."
            # Reset recipe specific fields if it's just a bot message
            output["recipeName"] = "N/A"
            output["ingredients"] = "N/A"
            output["instructions"] = "N/A"
            output["totalCalories"] = 0
            app.logger.info("Parsed as a general bot message.")
        else:
            app.logger.info(f"Parsed recipe: {output['recipeName']}, Calories: {output['totalCalories']}")

    except Exception as e:
        app.logger.error(f"Error during response parsing: {e}\n{traceback.format_exc()}")
        output["botMessage"] = "Error parsing the model's response. Raw: " + raw_response_text
        output["recipeName"] = "Parsing Error"
        # Other fields remain "N/A" or 0

    # Ensure botMessage is set if other fields are default, indicating a non-recipe response
    if output["recipeName"] == "N/A" and output["ingredients"] == "N/A" and output["instructions"] == "N/A" and not output["botMessage"]:
        output["botMessage"] = "I received a response, but it doesn't look like a recipe. Could you try rephrasing?"
        app.logger.info("Response did not seem to be a recipe, setting default botMessage.")

    return output


@app.route('/generate_recipe', methods=['POST'])
def generate_recipe_route():
    if lora_model is None or tokenizer is None:
        app.logger.error("Model or tokenizer not loaded. Cannot process request.")
        return jsonify({
            "recipeName": "Service Error",
            "ingredients": "N/A",
            "instructions": "N/A",
            "totalCalories": 0,
            "botMessage": "The recipe generation service is not properly initialized. Please contact support."
        }), 503 # Service Unavailable

    try:
        data = request.get_json()
        if not data or 'userQuery' not in data:
            app.logger.warning("Missing userQuery in request body")
            return jsonify({"error": "Missing userQuery in request body"}), 400
        
        input_text = data['userQuery']
        app.logger.info(f"Received userQuery: {input_text}")

        structured_prompt = f"""You are "Green Recipe Genie", a friendly and helpful chatbot that suggests recipes.
The user has sent the following message: "{input_text}"

Analyze the user's message to understand their needs. Extract any mentioned:
1. Ingredients they have or want to use (optional).
2. Maximum calorie count (if specified, the recipe should be within this limit, otherwise estimate) (optional).
3. Dietary restrictions (e.g., vegan, gluten-free, low-carb) (optional).

Based on this information, suggest a suitable recipe.
- If specific ingredients are mentioned, try to use them.
- If a maximum calorie count is given, ensure the recipe is within that limit. If not specified by the user, suggest a recipe with a reasonable calorie count (e.g., 300-700 calories for a main meal) and state the estimated total calories.
- If dietary restrictions are mentioned, the recipe must adhere to them.
- If the user's query is vague (e.g., "I'm hungry", "suggest a recipe") or does not provide enough specific information for a tailored recipe, suggest a popular, relatively simple recipe that is generally appealing. For example, if they say "I want something vegetarian", pick a popular vegetarian dish.

Your response MUST be structured. Provide the following information with clear labels:
recipeName: [The name of the suggested recipe]
ingredients:
- [Ingredient 1 with quantity]
- [Ingredient 2 with quantity]
instructions:
1. [Step 1]
2. [Step 2]
totalCalories: [The estimated total calorie count of the recipe. Provide a number.]
botMessage: [Optional: A friendly message from the bot, e.g., if no recipe could be found, if the query was unclear, or if it's a greeting. If no specific bot message, put "N/A".]

Example of a good response structure:
recipeName: Quick Chicken Stir-fry
ingredients:
- 1 lb chicken breast, sliced
- 1 tbsp soy sauce
- 1 cup broccoli florets
- 1/2 red bell pepper, sliced
instructions:
1. Marinate chicken with soy sauce.
2. Stir-fry chicken until cooked.
3. Add vegetables and cook until tender-crisp.
totalCalories: 450
botMessage: N/A

If you cannot reasonably interpret the query as a recipe request, or if the query is completely unrelated to food or recipes, OR if you cannot find a suitable recipe based on very restrictive or conflicting constraints, set the 'botMessage' field with a polite message explaining this and provide placeholder values for other fields (e.g., recipeName: "No Recipe Found", ingredients: "N/A", instructions: "N/A", totalCalories: 0).

User Query: "{input_text}"
Response:
"""
        app.logger.info("Constructed structured prompt for the model.")

        inputs = tokenizer(structured_prompt, return_tensors="pt")
        inputs = accelerator.prepare(inputs)
        input_ids = inputs['input_ids'].to(accelerator.device)
        if attention_mask is not None:
            attention_mask = attention_mask.to(lora_model.device)

        with torch.no_grad():
            generation_args = {
                "max_length": 1536, # Increased for potentially long recipes + structured output
                "num_return_sequences": 1, 
                "pad_token_id": tokenizer.pad_token_id,
                "eos_token_id": tokenizer.eos_token_id,
                "do_sample": True,
                "top_k": 50,
                "top_p": 0.95,
                "temperature": 0.7
            }
            if attention_mask is not None:
                generation_args["attention_mask"] = attention_mask
            
            app.logger.info(f"Generating response with args: {generation_args}")
            outputs = lora_model.generate(input_ids, **generation_args)

        raw_response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        app.logger.info(f"Raw model output (full): {raw_response_text}")
        
        # Attempt to extract only the generated part, not the prompt
        # This heuristic looks for the start of the model's actual response after "Response:"
        response_marker = "Response:"
        marker_index = raw_response_text.rfind(response_marker) # Use rfind to get the last instance
        if marker_index != -1:
            actual_generated_text = raw_response_text[marker_index + len(response_marker):].strip()
            app.logger.info("Extracted text after 'Response:' marker.")
        else:
            # Fallback if "Response:" marker is not found, try to remove the prompt
            if raw_response_text.startswith(structured_prompt):
                 actual_generated_text = raw_response_text[len(structured_prompt):].strip()
                 app.logger.info("Removed prompt from start of response.")
            else:
                actual_generated_text = raw_response_text.strip() # Use as is, hoping it's just the answer
                app.logger.warning("Could not reliably strip prompt from response. Using full output.")
        
        app.logger.info(f"Text to parse: {actual_generated_text[:500]}...")
        structured_response = parse_model_response_to_json(actual_generated_text, input_text)
        
        app.logger.info(f"Returning structured response: {structured_response}")
        return jsonify(structured_response)

    except Exception as e:
        app.logger.error(f"Error during inference: {e}\n{traceback.format_exc()}")
        return jsonify({
            "recipeName": "Error",
            "ingredients": "N/A",
            "instructions": "N/A",
            "totalCalories": 0,
            "botMessage": f"Sorry, an unexpected error occurred on the server: {str(e)}"
        }), 500

if __name__ == '__main__':
    # For Docker, model paths are typically set via ENV or volume mounts.
    # If running locally:
    # export MODEL_BASE_PATH=/path/to/your/base_model
    # export LORA_MODEL_PATH=/path/to/your/lora_adapter
    # The defaults in the script point to /models/ which is a common Docker pattern.
    
    # Check if model loaded correctly before starting server
    if lora_model is None or tokenizer is None:
        app.logger.critical("Application will not start correctly as model or tokenizer failed to load.")
        # In a real production system, you might exit here or have a more robust health check
    else:
        app.logger.info("Flask server starting up...")
        app.run(host='0.0.0.0', port=5001, debug=False) # debug=False for production
