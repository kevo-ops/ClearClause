let endpointURL = 'https://api.runpod.ai/v2/2ci3vtyckm51gi';

const key = 'rpa_NIYT4VIK7Q903YLZ6SBBYM8PJHYDR5YCIMY5BASTmjuc5p';
let jobid = '';

const extractPrivacyPolicy = () => {
  const links = document.querySelectorAll('a');
  for (let link of links) {
    if (/(privacy policy|privacy)/i.test(link.textContent)) {
      return link.href;
    }
  }
  return null;
};

const checkCurrentPageForPolicy = () => {
  const bodyText = document.body.innerText || '';
  const title = document.title || '';
  const url = window.location.href || '';
  const metaTags = Array.from(document.getElementsByTagName('meta')).map(meta => meta.content || '').join(' ');

  // Combine the title, URL, and meta tags into one searchable string
  const searchableText = `${title} ${url} ${metaTags}`;

  // Check for keywords in title, URL, or meta tags
  if (/(privacy policy|your privacy|data usage|data protection)/i.test(searchableText)) {
    return bodyText;
  }
  return null;
};


const cleanText = (text) => {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const showModal = (content) => {
  let modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '10%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, 0)';
  modal.style.background = 'black';
  modal.style.padding = '20px';
  modal.style.border = '1px solid white';
  modal.style.zIndex = '999999'; // high z-index to stay on top
  modal.style.width = '80%';
  modal.style.maxHeight = '60vh';
  modal.style.overflowY = 'auto';
  modal.style.borderRadius = '10px';
  modal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)'; // Stronger shadow for visibility
  modal.style.color = 'white';

  const contentFormatted = content.replace(/\n/g, '<br><br>'); //need to replace newline with breaks
  modal.innerHTML = `
          <button id = "xButton" style = "margin-top:10px;padding:5px 10px;float:right">x</button>
          <h3>Privacy Policy Summary</h3>
          <br>
          <p>${contentFormatted}</p>
          <button id="closeModal" style="margin-top:10px;padding:5px 10px;">Close</button>
      `;

  document.body.appendChild(modal);

  document.getElementById('closeModal').addEventListener('click', () => {
    modal.remove();
  });
  document.getElementById('xButton').addEventListener('click', () => {
    modal.remove();
  });
};

const getText = async (givenText) => {
  try {
    let text = '';
    if (givenText === undefined) {
      text = checkCurrentPageForPolicy();
    } else {
      text = givenText;
    }
    if (text) {
      text = cleanText(text);
      summarizeText(text);
      return;
    }

    let privacyPolicyUrl = extractPrivacyPolicy();

    if (!privacyPolicyUrl) {
      const searchQuery = encodeURIComponent(
        `${window.location.hostname} privacy policy`
      );
      privacyPolicyUrl = `https://www.google.com/search?q=${searchQuery}`;
    }

    const fetchTextFromUrl = async (url) => {
      const response = await fetch(url);
      if (response.ok) {
        const parser = new DOMParser();
        const htmlDocument = parser.parseFromString(
          await response.text(),
          'text/html'
        );
        return cleanText(htmlDocument.body.textContent || '');
      } else {
        throw new Error('Could not fetch the privacy policy.');
      }
    };

    if (privacyPolicyUrl.includes('google.com')) {
      showModal(
        'Could not locate a privacy policy on the current site. Please check the Google search results.'
      );
      window.open(privacyPolicyUrl, '_blank');
    } else {
      text = await fetchTextFromUrl(privacyPolicyUrl);
      const summary = await summarizeText(text);
      showModal(summary);
    }
  } catch (error) {
    console.error(error);
    showModal('Failed to summarize the privacy policy: ' + error.message);
  }
};

async function summarizeText(text) {
  const requestConfig = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ input: { prompt: text } }),
  };

  try {
    const response = await fetch(endpointURL + '/run', requestConfig);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    jobid = data.id;

    chrome.runtime.sendMessage(
      { action: 'updateStatus', text: data.status },
      (response) => {
        if (response.success) {
          console.log('Data successfully sent to background script.');
        }
      }
    );
    waitForSummary();
  } catch (error) {
    console.error('Error fetching summary:', error);
    throw error;
  }

  //   const response = await fetch("https://ad6b-34-19-70-13.ngrok-free.app/summarize", {
  //       method: "POST",
  //       headers: {
  //           "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ text: text }),
  //   });

  //   if (response.ok) {
  //       const data = await response.json();
  //       console.log("Server response:", data);
  //       return data.summary || "No summary returned.";
  //   } else {
  //       throw new Error("Error fetching summary: " + response.status);
  //   }
}

async function waitForSummary() {
  let isRunning = false;
  checkStatus = setInterval(async () => {
    if (isRunning) return;
    isRunning = true;
    const requestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
      },
    };
    try {
      const response = await fetch(
        `${endpointURL}/status/${jobid}`,
        requestConfig
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      isRunning = false;

      chrome.runtime.sendMessage(
        { action: 'updateStatus', text: data.status },
        (response) => {
          if (response.success) {
            console.log('Data successfully sent to background script.');
          }
        }
      );
      if (data.status == 'COMPLETED') {
        const parsedOutput = JSON.parse(data.output);
        const summary = parsedOutput.summary;
        console.log(data);
        clearInterval(checkStatus);
        showModal(summary || 'no summary returned');
      }
    } catch (error) {
      isRunning = false;
      console.error('Error fetching summary:', error);
      clearInterval(checkStatus);
      throw error;
    }
  }, 1000);
}

async function cancelSummary() {
  const requestConfig = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
  };

  try {
    const response = await fetch(
      `${endpointURL}/cancel/${jobid}`,
      requestConfig
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    chrome.runtime.sendMessage(
      { action: 'updateStatus', text: data.status },
      (response) => {
        if (response.success) {
          console.log('Data successfully sent to background script.');
        }
      }
    );
  } catch (error) {
    console.error('Error cancelling summary:', error);
    throw error;
  }
  //   const response = await fetch("https://ad6b-34-19-70-13.ngrok-free.app/summarize", {
  //       method: "POST",
  //       headers: {
  //           "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ text: text }),
  //   });

  //   if (response.ok) {
  //       const data = await response.json();
  //       console.log("Server response:", data);
  //       return data.summary || "No summary returned.";
  //   } else {
  //       throw new Error("Error fetching summary: " + response.status);
  //   }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'userInput':
      getText(message.text);
      sendResponse({ success: true, message: 'Input processed.' });
      break;
    case 'autoSummary':
      getText();
      sendResponse({ success: true, message: 'Auto-summary started.' });
      break;
    case 'cancelSummary':
      cancelSummary();
      sendResponse({ success: true });
      break;
    default:
      console.warn('Unknown action received:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
      break;
  }
});
