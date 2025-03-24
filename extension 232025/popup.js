async function summarizeText(text) {
    const response = await fetch("https://d20c-34-125-95-125.ngrok-free.app/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });
  
    if (response.ok) {
      const data = await response.json();
      return data.summary;
    } else {
      throw new Error("Error fetching summary: " + response.status);
    }
  }

document.getElementById('summarize').addEventListener('click', async () => {
    const manualInput = document.getElementById('manualInput').value.trim();
  
    if (manualInput) {
      try {
        const summary = await summarizeText(manualInput);
        alert(summary);
      } catch (error) {
        console.error("Failed to summarize manual input:", error);
        alert("Failed to summarize the provided text: " + error.message);
      }
    } else {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (error) {
        console.error("Failed to execute content script:", error);
      }
    }
  });
  