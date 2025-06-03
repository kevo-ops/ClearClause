

let latestStatus = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStatus') {
    latestStatus = message.text; // Update the stored data
    console.log('Latest status updated:', latestStatus);
    sendResponse({ success: true });
  }
if (message.action === 'cancelSummary') {
  chrome.tabs.get(message.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      console.error('Tab does not exist or cannot be accessed:', chrome.runtime.lastError?.message);
      sendResponse({ success: false, error: 'Tab does not exist or cannot be accessed.' });
      return;
    }

    chrome.tabs.sendMessage(
      message.tabId,
      { action: 'cancelSummary', data: message },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with content script:', chrome.runtime.lastError.message);
        } else if (response && response.success) {
          console.log('Cancel in content.js executed successfully.');
        } else {
          console.error('Failed to execute cancel in content.js.');
        }
      }
    );
  });
  return true; // Required for async response in Chrome
}

if (message.action === 'autoSummary') {
  chrome.tabs.get(message.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      console.error('Tab does not exist or cannot be accessed:', chrome.runtime.lastError?.message);
      sendResponse({ success: false, error: 'Tab does not exist or cannot be accessed.' });
      return;
    }

    chrome.tabs.sendMessage(
      message.tabId,
      { action: 'autoSummary', data: message },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with content script:', chrome.runtime.lastError.message);
        } else if (response && response.success) {
          console.log('autosummary in content.js executed successfully.');
        } else {
          console.error('Failed to execute autosummary in content.js.');
        }
      }
    );
  });
  return true; // Required for async response in Chrome
}

  if (message.action === 'getStatus') {
    // Send the latest data to the popup
    sendResponse({ success: true, status: latestStatus });
  } else {
    console.warn('Unrecognized action:', message.action);
    sendResponse({ success: false, error: 'Unknown action' });
  }
});
