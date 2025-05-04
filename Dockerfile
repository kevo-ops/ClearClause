FROM python:3.11.1-slim

WORKDIR /app

# Copy and install requirements
COPY builder/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# Copy your handler code
COPY src/rp_handler.py .


# Pre-download the BART-large model
RUN python -c "from transformers import AutoModelForSeq2SeqLM, AutoTokenizer; \
    AutoModelForSeq2SeqLM.from_pretrained('facebook/bart-large'); \
    AutoTokenizer.from_pretrained('facebook/bart-large')"



# Command to run when the container starts
CMD ["python", "-u", "/rp_handler.py"]
