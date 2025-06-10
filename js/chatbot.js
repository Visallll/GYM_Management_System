// Wait for the DOM to fully load before running the script
document.addEventListener("DOMContentLoaded", () => {
  // Get references to key elements in the chat UI
  const chatBody = document.getElementById("chat-body");      // Container for chat messages
  const chatInput = document.getElementById("chat-input");    // Text input for user messages
  const chatSend = document.getElementById("chat-send");      // Send button
  const chatPrompts = document.querySelectorAll(".chat-prompt"); // Predefined quick reply buttons

  // Function to append a new message bubble to the chat body
  function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = sender;  // 'user' or 'bot'
    msg.innerText = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight; // Auto scroll to latest
  }

  // Show initial welcome messages from the bot
  appendMessage("bot", "🏋️‍♂️ Welcome to Big Boss Gym! I'm GymBot.");
  appendMessage("bot", "🤖 You can ask about membership, pricing, classes, trainers, and more!");

  // Function to send user input to backend and display response
  function sendMessage(input) {
    if (!input) return;
    appendMessage("user", input);
    chatInput.value = "";

    // Send GET request to /chatbot with ?msg= query
    fetch(`http://localhost:5000/chatbot?msg=${encodeURIComponent(input)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then(reply => {
        setTimeout(() => appendMessage("bot", reply.trim()), 500);
      })
      .catch(err => {
        console.error(err);
        appendMessage("bot", "⚠️ Sorry, I couldn’t connect to the server.");
      });
  }

  // Send on button click
  chatSend.addEventListener("click", () => sendMessage(chatInput.value.trim()));

  // Send on Enter key
  chatInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage(chatInput.value.trim());
  });

  // Quick prompt buttons
  chatPrompts.forEach(button => {
    button.addEventListener("click", () => {
      sendMessage(button.innerText);
    });
  });
});
