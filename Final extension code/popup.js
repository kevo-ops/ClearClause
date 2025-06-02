document.getElementById('summarize').addEventListener('click', async () => {
  const manualInput = document.getElementById('manualInput').value.trim();

  if (manualInput) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tab found.');
        return;
      }

      const tab = tabs[0];
      chrome.tabs.get(tab.id, (existingTab) => {
        if (chrome.runtime.lastError || !existingTab) {
          console.error(
            'Tab does not exist or cannot be accessed:',
            chrome.runtime.lastError?.message
          );
          alert('Error: No valid tab found.');
          return;
        }

        chrome.tabs.sendMessage(
          tab.id,
          { action: 'userInput', text: manualInput },
          (response) => {
            if (response && response.success) {
              console.log('Text sent successfully:', response.message);
            } else {
              console.error(
                'Failed to send text:',
                response?.error || chrome.runtime.lastError?.message
              );
            }
          }
        );
      });
    });
  } else {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          // Send the input to the content script
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'autoSummary' },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  'Error communicating with content script:',
                  chrome.runtime.lastError.message
                );
              }
              if (response && response.success) {
                console.log('auto text sent successfully:', response.message);
              } else if (response && response.error) {
                console.error('Failed to send auto text:', response.error);
              }
              else {
                console.error('No response received or unknown error occurred.');
              }
            }
          );
        }
      });
    } catch (error) {
      console.error('Failed to summarize auto input:', error);
      alert("Failed to summarize the page's text: " + error.message);
    }
  }
});

document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('manualInput').value = '';
});

document.getElementById('cancel').addEventListener('click', async () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tab found.');
        return;
      }

      const tab = tabs[0];
      chrome.tabs.get(tab.id, (existingTab) => {
        if (chrome.runtime.lastError || !existingTab) {
          console.error(
            'Tab does not exist or cannot be accessed:',
            chrome.runtime.lastError?.message
          );
          alert('Error: No valid tab found.');
          return;
        }

        chrome.tabs.sendMessage(
          tab.id,
          { action: 'cancelSummary'},
          (response) => {
            if (response && response.success) {
              console.log('Cancel request sent succesfully:', response.message);
            } else {
              console.error(
                'Failed to send cancel request:',
                response?.error || chrome.runtime.lastError?.message
              );
            }
          }
        );
      });
    });
});

const getStatus = () => {
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response.success) {
      const displayArea = document.getElementById('status');
      displayArea.innerText = response.status || 'No data available.';
      if (response.status == 'IN_QUEUE' || response.status == 'IN_PROGRESS') {
        document.getElementById('summarize').disabled = true;
        document.getElementById('cancel').disabled = false;
      } else {
        document.getElementById('summarize').disabled = false;
        document.getElementById('cancel').disabled = true;
      }
    } else {
      console.error('Failed to get status from background script.');
    }
  });
};

setInterval(getStatus, 1000);
