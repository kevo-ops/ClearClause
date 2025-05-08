



from flask import Flask, request, jsonify
from flask_cors import CORS
from pyngrok import ngrok



app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

#@app.after_request
#def add_cors_headers(response):
#    response.headers["Access-Control-Allow-Origin"] = "*"
#    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
#    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
#    return response

# Load the tokenizer and model

# Load model directly


from transformers import pipeline


summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
# Function to split text into manageable chunks
def split_text(text, max_chunk_size=900):
    sentences = text.split('. ')
    chunks = []
    current_chunk = []
    current_size = 0

    for sentence in sentences:
        sentence_size = len(sentence)
        if current_size + sentence_size > max_chunk_size:
            chunks.append('. '.join(current_chunk) + '.')
            current_chunk = [sentence]
            current_size = sentence_size
        else:
            current_chunk.append(sentence)
            current_size += sentence_size + 1

    if current_chunk:
        chunks.append('. '.join(current_chunk) + '.')

    return chunks

# Function to summarize text
def summarize_text(text):
  return  summarizer(text, max_length=130, min_length=30, do_sample=False)[0]['summary_text']


# Function to summarize large texts by splitting
#now bullet points
def summarize_large_text(text):
    chunks = split_text(text)
    summarized_chunks = [summarize_text(chunk) for chunk in chunks]
    bullet_points = "\n".join([f"- {chunk}" for chunk in summarized_chunks])
    return bullet_points

@app.route('/')
def home():
    return "Hello, World!"

@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.json
    text = data.get('text')
    print(f"Received text: {text}")  # Log the incoming text
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    try:
        summary = summarize_large_text(text)
        print(f"Summary: {summary}")  # Log the summary
        return jsonify({'summary': summary})
    except Exception as e:
        print(f"Error: {e}")  # Log any error
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Start ngrok
    ngrok.set_auth_token("2sYFVWRRHbTuphmnKCayd3g3rHD_5jafgHXKDAbUt4svJ4Gau")
    public_url = ngrok.connect(5000)
    print("ngrok public URL:", public_url)

    # Start Flask server
    app.run(port=5000)