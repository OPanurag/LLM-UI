FROM python:3.10-slim

WORKDIR /app

# Install system dependencies that might be needed by torch or other libraries
# e.g., for some OpenCV or sound related tasks, but usually not for basic transformers
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgl1-mesa-glx \
#  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user for security
RUN useradd -ms /bin/bash myuser
USER myuser
WORKDIR /home/myuser/app

COPY . .

# Default model paths within the container.
# These can be overridden by environment variables at runtime (docker run -e ...).
# Models should be mounted as volumes or copied into these locations during image build if large.
ENV MODEL_BASE_PATH=/models/base_model
ENV LORA_MODEL_PATH=/models/recipe_model_lora_full/final_adapter

# Ensure the directory for models exists if you plan to copy models into the image here
# RUN mkdir -p /models
# COPY path_to_your_local_models_on_build_machine/base_model /models/base_model
# COPY path_to_your_local_models_on_build_machine/recipe_model_lora_full /models/recipe_model_lora_full


# Environment variable for Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5001
# Set PYTHONUNBUFFERED to 1 to ensure print statements and logs are sent directly to terminal/Docker logs
ENV PYTHONUNBUFFERED=1


EXPOSE 5001

# CMD ["flask", "run"]
# Using python app.py directly if app.run() is configured in app.py
CMD ["python", "app.py"]
