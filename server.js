require('dotenv').config();

const express = require("express");

const cors = require("cors");

const fs = require("fs");

const path = require("path");


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

const GROQ_MODEL   = "openai/gpt-oss-120b"; // Free & fast Groq model


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

app.get("/", (req, res) => {

  res.sendFile(path.join(__dirname, "./index.html"));

});


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


app.post("/update-username", (req, res) => {

  const { oldUsername, newUsername, password } = req.body;

  if (!oldUsername || !newUsername || !password) {

    return res.json({ success: false, message: "Missing required fields." });

  }


  const users = loadUsers();

  const userIndex = users.findIndex(u => u.username === oldUsername && u.password === password);


  if (userIndex === -1) {

    return res.json({ success: false, message: "Invalid current username or password." });

  }


  if (users.find(u => u.username === newUsername)) {

    return res.json({ success: false, message: "New username already exists." });

  }


  users[userIndex].username = newUsername;

  saveUsers(users);

  res.json({ success: true, message: "Username updated successfully!" });

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

          { role: "user",   content: message }

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


// ANALYZE URL API

app.post("/analyze-url", async (req, res) => {

  const { url } = req.body;


  if (!url) {

    return res.json({ success: false, message: "Please provide a URL." });

  }


  const apiKey = process.env.GROQ_API_KEY;


  if (!apiKey) {

    return res.json({

      success: false,

      message: "⚠️ No Groq API key found. Please add GROQ_API_KEY to your .env file.\n\nGet a FREE key at: https://console.groq.com"

    });

  }


  try {

    // First, try to fetch the URL content

    const fetchResponse = await fetch(url, {

      method: "GET",

      headers: {

        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

      }

    });


    if (!fetchResponse.ok) {

      return res.json({ success: false, message: `Failed to fetch URL. Status: ${fetchResponse.status}` });

    }


    const html = await fetchResponse.text();


    // Extract text content from HTML (simple approach)

    const text = html

      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")

      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

      .replace(/<[^>]+>/g, " ")

      .replace(/\s+/g, " ")

      .substring(0, 8000); // Limit to first 8000 chars for API


    if (text.length < 50) {

      return res.json({ success: false, message: "Could not extract meaningful content from this URL." });

    }


    // Send to Groq for analysis

    const analysisPrompt = `You are Justice AI, a legal analysis assistant. Analyze the following content from a URL and provide:

1. A brief summary of what the content is about

2. Any legal relevance or implications

3. Key points that might be useful for legal research


Content:

${text}`;


    const groqResponse = await fetch(GROQ_API_URL, {

      method: "POST",

      headers: {

        "Authorization": `Bearer ${apiKey}`,

        "Content-Type": "application/json"

      },

      body: JSON.stringify({

        model: GROQ_MODEL,

        messages: [

          { role: "system", content: SYSTEM_PROMPT },

          { role: "user", content: analysisPrompt }

        ],

        temperature: 0.7,

        max_tokens: 1024

      })

    });


    const data = await groqResponse.json();


    if (data.error) {

      console.error("Groq API Error:", data.error);

      return res.json({ success: false, message: `❌ API Error: ${data.error.message}` });

    }


    const analysis = data.choices?.[0]?.message?.content || "No analysis available.";

    res.json({ success: true, analysis });


  } catch (err) {

    console.error("URL analysis error:", err);

    res.json({ success: false, message: "Error analyzing URL. The site may be blocking requests or unavailable." });

  }

});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`✅ Justice AI server running on http://localhost:${PORT}`));

