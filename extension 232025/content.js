(async () => {
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
      const bodyText = document.body.innerText || "";
      if (/(privacy policy|your privacy|data usage|data protection)/i.test(bodyText)) {
          return bodyText;
      }
      return null;
  };

  const cleanText = (text) => {
      return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  };

    const showModal = (content) => {
        let modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "10%";
        modal.style.left = "50%";
        modal.style.transform = "translate(-50%, 0)";
        modal.style.background = "black";
        modal.style.padding = "20px";
        modal.style.border = "1px solid white";
        modal.style.zIndex = "999999";  // high z-index to stay on top
        modal.style.width = "80%";
        modal.style.maxHeight = "60vh";
        modal.style.overflowY = "auto";
        modal.style.borderRadius = "10px";
        modal.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";  // Stronger shadow for visibility
        modal.style.color = "white"

        // Ensure modal is inside the <body>
        document.body.appendChild(modal);

      modal.innerHTML = `
          <h3>Privacy Policy Summary</h3>
          <p>${content}</p>
          <button id="closeModal" style="margin-top:10px;padding:5px 10px;">Close</button>
      `;

      document.body.appendChild(modal);

      document.getElementById("closeModal").addEventListener("click", () => {
          modal.remove();
      });
  };

  try {
      let text = checkCurrentPageForPolicy();
      if (text) {
          text = cleanText(text);
          const summary = await summarizeText(text);
          showModal(summary);
          return;
      }

      let privacyPolicyUrl = extractPrivacyPolicy();

      if (!privacyPolicyUrl) {
          const searchQuery = encodeURIComponent(`${window.location.hostname} privacy policy`);
          privacyPolicyUrl = `https://www.google.com/search?q=${searchQuery}`;
      }

      const fetchTextFromUrl = async (url) => {
          const response = await fetch(url);
          if (response.ok) {
              const parser = new DOMParser();
              const htmlDocument = parser.parseFromString(await response.text(), "text/html");
              return cleanText(htmlDocument.body.textContent || "");
          } else {
              throw new Error("Could not fetch the privacy policy.");
          }
      };

      if (privacyPolicyUrl.includes('google.com')) {
          showModal("Could not locate a privacy policy on the current site. Please check the Google search results.");
          window.open(privacyPolicyUrl, '_blank');
      } else {
          text = await fetchTextFromUrl(privacyPolicyUrl);
          const summary = await summarizeText(text);
          showModal(summary);
      }
  } catch (error) {
      console.error(error);
      showModal("Failed to summarize the privacy policy: " + error.message);
  }
})();

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
      console.log("Server response:", data);
      return data.summary || "No summary returned.";
  } else {
      throw new Error("Error fetching summary: " + response.status);
  }
}
