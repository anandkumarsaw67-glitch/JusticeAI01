const express = require('express');

const cors = require('cors');

const bodyParser = require('body-parser');

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });


const app = express();

const PORT = process.env.PORT || 3000;


// Middleware

app.use(cors());

app.use(bodyParser.json());


// In-memory user storage (for demo purposes)

const users = {};


// API Endpoints


// Login

app.post('/login', (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {

    return res.json({ success: false, message: 'Username and password required' });

  }

  if (users[username] && users[username].password === password) {

    return res.json({ success: true, message: 'Login successful' });

  }

  return res.json({ success: false, message: 'Invalid credentials' });

});


// Signup

app.post('/signup', (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {

    return res.json({ success: false, message: 'Username and password required' });

  }

  if (users[username]) {

    return res.json({ success: false, message: 'Username already exists' });

  }

  users[username] = { password };

  return res.json({ success: true, message: 'Account created successfully' });

});


// Reset password

app.post('/reset', (req, res) => {

  const { username, newPassword } = req.body;

  if (!username || !newPassword) {

    return res.json({ success: false, message: 'Username and new password required' });

  }

  if (!users[username]) {

    return res.json({ success: false, message: 'User not found' });

  }

  users[username].password = newPassword;

  return res.json({ success: true, message: 'Password updated successfully' });

});


// Chat endpoint - integrate with Grok API

app.post('/chat', async (req, res) => {

  const { message } = req.body;

  if (!message) {

    return res.json({ reply: 'Please provide a message.' });

  }


  try {

    // For demo, we'll simulate a response. In real implementation, call Grok API

    const reply = await getLegalAdvice(message);

    res.json({ reply });

  } catch (error) {

    console.error('Error getting AI response:', error);

    res.json({ reply: 'Sorry, I encountered an error. Please try again.' });

  }

});


// Function to get legal advice using AI APIs

async function getLegalAdvice(message) {

  try {

    // Try Grok API first

    const grokResponse = await callGrokAPI(message);

    if (grokResponse) {

      return grokResponse;

    }

  } catch (error) {

    console.log('Grok API failed, trying Hindsight API:', error.message);

  }


  try {

    // Fallback to Hindsight API

    const hindsightResponse = await callHindsightAPI(message);

    if (hindsightResponse) {

      return hindsightResponse;

    }

  } catch (error) {

    console.log('Hindsight API failed:', error.message);

  }


  // Final fallback to basic responses

  return getFallbackResponse(message);

}


// Call Grok API

async function callGrokAPI(message) {

  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {

    console.log('Grok API key not found');

    throw new Error('Grok API key not found');

  }


  try {

    const response = await fetch('https://api.grok.x.ai/v1/chat/completions', {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        'Authorization': `Bearer ${apiKey}`

      },

      body: JSON.stringify({

        model: 'grok-beta',

        messages: [

          {

            role: 'system',

            content: 'You are Justice AI, a legal assistant. Provide helpful, accurate legal information while always reminding users that this is not formal legal advice and they should consult qualified attorneys. Focus on general legal principles, explain concepts clearly, and suggest next steps for professional consultation.'

          },

          {

            role: 'user',

            content: message

          }

        ],

        max_tokens: 1000,

        temperature: 0.7

      })

    });


    if (!response.ok) {

      console.log(`Grok API error: ${response.status} ${response.statusText}`);

      throw new Error(`Grok API error: ${response.status}`);

    }


    const data = await response.json();

    console.log('Grok API response received');

    return data.choices[0]?.message?.content || null;

  } catch (error) {

    console.log('Grok API call failed:', error.message);

    throw error;

  }

}


// Call Hindsight API (placeholder - adjust based on actual API)

async function callHindsightAPI(message) {

  const apiKey = process.env.HINDSIGHT_API_KEY;

  if (!apiKey) {

    throw new Error('Hindsight API key not found');

  }


  // Note: This is a placeholder implementation. Adjust the API endpoint and request format

  // based on Hindsight's actual API documentation

  const response = await fetch('https://api.hindsight.ai/v1/legal-advice', {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      'Authorization': `Bearer ${apiKey}`

    },

    body: JSON.stringify({

      query: message,

      context: 'legal_assistance'

    })

  });


  if (!response.ok) {

    throw new Error(`Hindsight API error: ${response.status}`);

  }


  const data = await response.json();

  return data.advice || data.response || null;

}


// Fallback responses when APIs are unavailable

function getFallbackResponse(message) {

  const lowerMessage = message.toLowerCase();


  // Enhanced keyword-based responses

  if (lowerMessage.includes('contract') || lowerMessage.includes('agreement')) {

    return "Contracts are legally binding agreements between parties. Key elements include: offer, acceptance, consideration (something of value exchanged), capacity (legal ability to enter contract), and lawful purpose. For contract disputes, consider mediation or arbitration before litigation. Please consult an attorney for specific contract issues.";

  } else if (lowerMessage.includes('divorce') || lowerMessage.includes('marriage')) {

    return "Divorce proceedings vary significantly by jurisdiction. Important considerations include asset division, child custody and support, alimony/spousal support, and division of debts. Each state/country has different laws regarding property division (community property vs. equitable distribution). Consult a family law attorney for guidance specific to your situation.";

  } else if (lowerMessage.includes('employment') || lowerMessage.includes('job') || lowerMessage.includes('work')) {

    return "Employment law covers rights and obligations of employers and employees. Common issues include discrimination, wrongful termination, wage disputes, workplace harassment, and employee benefits. In many jurisdictions, employment is 'at-will' unless you have a contract. Seek advice from an employment lawyer for your specific circumstances.";

  } else if (lowerMessage.includes('criminal') || lowerMessage.includes('arrest') || lowerMessage.includes('police') || lowerMessage.includes('charge')) {

    return "Criminal matters are serious and require immediate legal attention. If you've been arrested or charged, you have the right to remain silent and the right to an attorney. Do not speak to law enforcement without legal counsel present. Contact a criminal defense attorney immediately.";

  } else if (lowerMessage.includes('property') || lowerMessage.includes('real estate') || lowerMessage.includes('house') || lowerMessage.includes('land')) {

    return "Property law involves complex regulations about ownership, transfer, and disputes. Real estate transactions typically involve title searches, appraisals, inspections, and legal documentation. For property disputes or transactions, consult a real estate attorney familiar with your local laws.";

  } else if (lowerMessage.includes('business') || lowerMessage.includes('company') || lowerMessage.includes('corporation')) {

    return "Business law covers formation, operation, and dissolution of companies. Consider business structure (LLC, corporation, partnership), compliance requirements, contracts, and regulatory issues. Consult a business attorney for proper setup and ongoing legal needs.";

  } else if (lowerMessage.includes('accident') || lowerMessage.includes('injury') || lowerMessage.includes('personal injury')) {

    return "Personal injury cases involve negligence claims for accidents causing harm. Key elements include duty of care, breach of duty, causation, and damages. Statutes of limitations apply. Consult a personal injury attorney to evaluate your case.";

  } else if (lowerMessage.includes('will') || lowerMessage.includes('estate') || lowerMessage.includes('inheritance')) {

    return "Estate planning involves wills, trusts, powers of attorney, and healthcare directives. Without proper planning, your estate may be subject to probate and higher taxes. Consult an estate planning attorney to protect your assets and wishes.";

  } else if (lowerMessage.includes('copyright') || lowerMessage.includes('patent') || lowerMessage.includes('trademark') || lowerMessage.includes('intellectual property')) {

    return "Intellectual property law protects creative works, inventions, and brands. Copyright protects original works, patents protect inventions, trademarks protect brands. Consult an IP attorney for protection and enforcement.";

  } else if (lowerMessage.includes('tax') || lowerMessage.includes('irs') || lowerMessage.includes('audit')) {

    return "Tax law is complex and varies by jurisdiction. Common issues include deductions, credits, compliance, and audits. Keep detailed records and consult a tax professional for your specific situation.";

  }


  // Generic helpful responses

  const helpfulResponses = [

    "I understand you're seeking legal information. While I can provide general guidance, laws vary by jurisdiction and specific situations require personalized legal advice. Please consult with a qualified attorney who can review your particular circumstances.",

    "Legal matters can be complex and fact-specific. While I can offer general information about legal principles, I strongly recommend consulting with a licensed attorney who can provide advice tailored to your situation and location.",

    "Every legal situation is unique and depends on specific facts, jurisdiction, and applicable laws. While I can explain general legal concepts, please seek guidance from a qualified legal professional for your particular case.",

    "Legal advice must consider your specific circumstances, local laws, and recent developments. While I can provide educational information about legal topics, I recommend consulting with an attorney for personalized guidance."

  ];


  return helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];

}


app.listen(PORT, () => {

  console.log(`Justice AI Backend running on port ${PORT}`);

});

