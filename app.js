const API = "http://localhost:5000";

async function sendMessage() {
  const msg = document.getElementById("message").value;
  const username = localStorage.getItem("user");

  if (!msg) {
    alert("Enter message");
    return;
  }

  try {
    const res = await fetch(API + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message: msg })
    });

    const data = await res.json();

    document.getElementById("history").innerHTML +=
      `<p><b>You:</b> ${msg}</p>
       <p><b>AI:</b> ${data.reply}</p>`;

  } catch (err) {
    console.error(err);
    alert("Error connecting to the server ❌. Please ensure the backend is running.");
  }
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Your browser does not support voice input. Please try Chrome or Edge.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onstart = function () {
    document.getElementById("message").placeholder = "Listening... Speak now!";
  };

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    const msgBox = document.getElementById("message");
    if (msgBox.value) {
      msgBox.value += " " + transcript;
    } else {
      msgBox.value = transcript;
    }
  };

  recognition.onerror = function (event) {
    console.error("Voice recognition error:", event.error);
    alert("Voice recognition error: " + event.error);
  };

  recognition.onend = function () {
    document.getElementById("message").placeholder = "Describe your legal problem in detail...";
  };

  recognition.start();
}

async function signup() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if (!username || !password) return alert("Enter both fields");

  const res = await fetch(API + "/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  alert(data.message);
  if (data.success) window.location.href = "login.html";
}

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if (!username || !password) return alert("Enter both fields");

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem("user", username);
    window.location.href = "index.html";
  } else {
    alert(data.message);
  }
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

function authCheck() {
  if (!localStorage.getItem("user")) {
    window.location.href = "login.html";
  } else {
    const userDisplay = document.getElementById("userDisplay");
    if (userDisplay) {
      userDisplay.innerText = "Welcome, " + localStorage.getItem("user");
    }
  }
}