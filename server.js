require("dotenv").config({ path: __dirname + '/.env' });
const express = require("express");
const cors = require("cors");
const fs = require("fs");

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(__dirname + '/users.json', 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(__dirname + '/users.json', JSON.stringify(users, null, 2));
}

const app = express();
app.use(express.json());
app.use(cors());

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Using Groq (free tier — https://console.groq.com) with llama3 model
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama3-70b-8192"; // Free & fast Groq model

const SYSTEM_PROMPT = `You are Justice AI, a highly knowledgeable and empathetic AI legal assistant. 
Your role is to:
1. Listen carefully to the user's legal problem.
2. Explain their legal rights in simple, clear language.
3. Suggest practical next steps they should take.
4. Draft a professional complaint letter if requested.
5. Recommend when to seek professional legal counsel.
Always be professional, compassionate, and thorough. Format your responses clearly with sections when helpful.`;
// ─────────────────────────────────────────────────────────────────────────────

// TEST ROUTE
// app.get("/", (req, res) => {
//   res.send("Justice AI Server running ✅ (Groq powered)");
// });

// AUTHENTICATION
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: "Missing fields" });

  const users = loadUsers();

  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: "Username already exists!" });
  }

  users.push({ username, password });
  saveUsers(users);
  res.json({ success: true, message: "Signup successful" });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, message: "Login successful" });
  } else {
    res.json({ success: false, message: "Invalid username or password" });
  }
});

app.post("/reset", (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) return res.json({ success: false, message: "Missing fields" });

  const users = loadUsers();
  const userIndex = users.findIndex(u => u.username === username);

  if (userIndex !== -1) {
    users[userIndex].password = newPassword;
    saveUsers(users);
    res.json({ success: true, message: "Password updated successfully!" });
  } else {
    res.json({ success: false, message: "Username not found." });
  }
});

// CHAT API (Groq)
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "Please provide a message." });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.json({
      reply: "⚠️ No Groq API key found. Please add GROQ_API_KEY to your backend/.env file.\n\nGet a FREE key at: https://console.groq.com"
    });
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    console.log("Groq API Response status:", response.status);

    if (data.error) {
      console.error("Groq API Error:", data.error);
      return res.json({ reply: `❌ API Error: ${data.error.message}` });
    }

    const reply = data.choices?.[0]?.message?.content || "No response received.";
    res.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    res.json({ reply: "❌ Server error occurred. Please try again." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Justice AI server running on http://localhost:${PORT}`));