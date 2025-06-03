FROM python:3.11.1-slim

WORKDIR /app

# Copy and install requirements
COPY builder/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# Copy the source code and test input
COPY src /app/src


# Pre-download the BART-large model
RUN python -c "from transformers import pipeline; pipeline('summarization', model='facebook/bart-large-cnn')"


# Command to run when the container starts
CMD ["python", "-u", "/app/src/rp_handler.py"]