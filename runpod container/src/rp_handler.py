import runpod 
import json





# Load the tokenizer and model

# Load model directly


from transformers import pipeline


# summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
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

def summarize(text):
    print(f"Received text: {text}")  # Log the incoming text
    if not text:
        return json.dumps({'error': 'No text provided'}), 400
    try:
        summary = summarize_large_text(text)
        print(f"Summary: {summary}")  # Log the summary
        return json.dumps({'summary': summary})
    except Exception as e:
        print(f"Error: {e}")  # Log any error
        return json.dumps({'error': str(e)}), 500

def handler(event):
    """
    This function processes incoming requests to your Serverless endpoint.
    
    Args:
        event (dict): Contains the input data and request metadata
        
    Returns:
        Any: The result to be returned to the client
    """
    
    # Extract input data
    print(f"Worker Start")
    input = event['input']
    
    prompt = input.get('prompt')  
#    seconds = input.get('seconds', 0)  

    print(f"Received prompt: {prompt}")
#    print(f"Sleeping for {seconds} seconds...")
    
    # You can replace this sleep call with your Python function to generate images, text, or run any machine learning workload
    return summarize(prompt)
    

# Start the Serverless function when the script is run
if __name__ == '__main__':
    runpod.serverless.start({'handler': handler })





