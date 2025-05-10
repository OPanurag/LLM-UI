'use server';

/**
 * @fileOverview A recipe suggestion AI chatbot that suggests recipes based on natural language user queries,
 * using a custom Python-based Hugging Face model.
 *
 * - suggestRecipe - A function that handles the recipe suggestion process.
 * - SuggestRecipeInput - The input type for the suggestRecipe function.
 * - SuggestRecipeOutput - The return type for the suggestRecipe function.
 */

import { z } from 'zod'; // Use genkit's zod for schema definition

const SuggestRecipeInputSchema = z.object({
  userQuery: z
    .string()
    .describe("The user's natural language message or query to the chatbot regarding recipe suggestions."),
});
export type SuggestRecipeInput = z.infer<typeof SuggestRecipeInputSchema>;

const SuggestRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the suggested recipe.'),
  ingredients: z.string().describe('A list of ingredients required for the recipe, including quantities. Should be formatted nicely, e.g., as a bulleted list.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe. Should be formatted nicely, e.g., as a numbered list.'),
  totalCalories: z.number().describe('The total calorie count of the recipe. Estimate if not provided by user.'),
  botMessage: z.string().optional().describe("A friendly message from the bot, e.g., if no recipe could be found or if the query was unclear.")
});
export type SuggestRecipeOutput = z.infer<typeof SuggestRecipeOutputSchema>;

const PYTHON_API_URL = process.env.PYTHON_INFERENCE_API_URL || 'http://localhost:5001/generate_recipe';

export async function suggestRecipe(input: SuggestRecipeInput): Promise<SuggestRecipeOutput> {
  try {
    console.log(`Sending query to Python API (${PYTHON_API_URL}): ${input.userQuery}`);
    const response = await fetch(PYTHON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userQuery: input.userQuery }),
      cache: 'no-store', // Ensure fresh data for each request
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Python API Error (${response.status}): ${errorBody}`);
      let detail = errorBody;
      try {
        const parsedError = JSON.parse(errorBody);
        detail = parsedError.error || parsedError.message || errorBody;
      } catch (e) {
        // ignore if errorBody is not JSON
      }
      return {
        recipeName: "Error from Recipe Service",
        ingredients: "N/A",
        instructions: "N/A",
        totalCalories: 0,
        botMessage: `Failed to get recipe. Service returned: ${response.status} - ${detail}`,
      };
    }

    const result = await response.json();
    
    const validation = SuggestRecipeOutputSchema.safeParse(result);
    if (!validation.success) {
        console.error("Invalid response structure from Python API:", validation.error.format());
        return {
            recipeName: "Invalid Response Format",
            ingredients: "The recipe data received was not in the expected format.",
            instructions: `Details: ${validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
            totalCalories: 0,
            botMessage: "Received an improperly structured response from the recipe generation service.",
        };
    }
    console.log("Received structured response from Python API:", validation.data);
    return validation.data;

  } catch (error: any) {
    console.error('Error calling Python API for recipe suggestion:', error);
    let errorMessage = "Unknown error occurred while contacting the recipe service.";
    if (error.cause && typeof error.cause === 'object' && 'code' in error.cause) {
        // Handle FetchError specific ECONNREFUSED
        if (error.cause.code === 'ECONNREFUSED') {
            errorMessage = `Could not connect to the recipe generation service at ${PYTHON_API_URL}. Please ensure the service is running.`;
        } else {
            errorMessage = `Network error: ${error.cause.code}`;
        }
    } else if (error.message) {
        errorMessage = error.message;
    }

    return {
      recipeName: "Connection Error",
      ingredients: "N/A",
      instructions: "N/A",
      totalCalories: 0,
      botMessage: `Sorry, I couldn't fetch a recipe right now. ${errorMessage}`,
    };
  }
}

// Note: The original Genkit flow definition (ai.defineFlow) is removed
// as the primary logic is now an HTTP call to an external Python service.
// If Genkit's flow features (like tracing, specific input/output validation at flow level)
// are still desired, this function could be wrapped in an ai.defineFlow.
// However, for a simple HTTP proxy, this direct async function is sufficient.
