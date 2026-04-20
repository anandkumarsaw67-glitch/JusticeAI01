const express = require('express');


const cors = require('cors');


const bodyParser = require('body-parser');


const path = require('path');


require('dotenv').config();



const app = express();


const PORT = process.env.PORT || 3000;



// Middleware


app.use(cors());


app.use(bodyParser.json());


// Serve static files from the current directory

app.use(express.static(__dirname));



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


            content: 'You are Justice AI, an expert legal assistant. You must provide highly detailed, comprehensive, and in-depth explanations for every legal query. Break down your response into clear sections: 1. Core Legal Principles, 2. Detailed Analysis of the scenario, 3. Potential Risks & Implications, and 4. Recommended Next Steps. Always remind the user that this is not formal legal advice and they should consult a qualified attorney. Do not give brief answers.'


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


    return "1. Core Legal Principles:\nContracts are legally binding agreements between two or more parties. Critical elements include: an offer, acceptance, mutual consideration (the exchange of something of value), competency (legal ability to enter a contract), and a lawful purpose.\n\n2. Detailed Analysis:\nIn any contract scenario, it is vital to assess whether all these elements are actively present. Verbal contracts can be binding, but they are incredibly difficult to prove. Written contracts provide explicit terms that dictate the rights and obligations of both sides.\n\n3. Potential Risks & Implications:\nBreach of contract can result in severe financial penalties or specific performance orders. Ambiguous clauses often lead to protracted litigation, compounding legal fees and business disruptions.\n\n4. Recommended Next Steps:\nBefore signing or disputing any contract, consider mediation or arbitration. Please consult an attorney for a formal review to safeguard your interests. This is not formal legal advice.";


  } else if (lowerMessage.includes('divorce') || lowerMessage.includes('marriage')) {


    return "1. Core Legal Principles:\nDivorce proceedings govern the legal dissolution of marriage. They involve complex divisions of assets, child custody and support determinations, and potential alimony. Family law heavily relies on jurisdictional guidelines (e.g., community property vs. equitable distribution).\n\n2. Detailed Analysis:\nWhen initiated, courts evaluate the duration of the marriage, the financial standing of each spouse, and the best interests of any children. Hiding assets or violating temporary court orders can heavily penalize the offending party.\n\n3. Potential Risks & Implications:\nA poorly negotiated divorce can affect your financial stability and parental rights for decades. Emotional distress may cloud judgment, leading to unfavorable settlements.\n\n4. Recommended Next Steps:\nOrganize all financial documents immediately and refrain from contentious interactions. Consult a dedicated family law attorney to map out a protective strategy. This is not formal legal advice.";


  } else if (lowerMessage.includes('employment') || lowerMessage.includes('job') || lowerMessage.includes('work')) {


    return "1. Core Legal Principles:\nEmployment law defines the rights, obligations, and responsibilities within the employer-employee relationship. Key areas include at-will employment doctrines, discrimination laws, workplace safety (OSHA), and wage regulations.\n\n2. Detailed Analysis:\nIf you feel wrongfully terminated or discriminated against, it is crucial to understand if your situation falls under protected classes or breaches a formal employment contract. The burden of proof often necessitates establishing a clear timeline and providing factual evidence of misconduct or breaches.\n\n3. Potential Risks & Implications:\nFailure to act within strict statutes of limitations or lack of substantial documentation can undermine a legitimate claim. Conversely, employers risk significant institutional damage and financial penalties for violations.\n\n4. Recommended Next Steps:\nCollect all relevant correspondences, contracts, and performance reviews. Seek advice from an employment lawyer before taking unilateral action. This is not formal legal advice.";


  } else if (lowerMessage.includes('criminal') || lowerMessage.includes('arrest') || lowerMessage.includes('police') || lowerMessage.includes('charge')) {


    return "1. Core Legal Principles:\nCriminal law applies to offenses against the state or public. Defendants possess Constitutional rights, most notably the right to remain silent and the right to legal counsel. The prosecution must prove guilt beyond a reasonable doubt.\n\n2. Detailed Analysis:\nNavigating criminal accusations requires extreme caution. Anything said to law enforcement can be used against you. Charges are typically categorized as misdemeanors or felonies, each carrying distinct procedural rules and potential sentences.\n\n3. Potential Risks & Implications:\nConvictions may lead to incarceration, severe fines, and a permanent criminal record, which dramatically restricts future employment, housing, and civil liberties.\n\n4. Recommended Next Steps:\nExercise your right to remain silent. Do not answer questions or consent to searches without a warrant. Contact a criminal defense attorney immediately. This is not formal legal advice.";


  } else if (lowerMessage.includes('property') || lowerMessage.includes('real estate') || lowerMessage.includes('house') || lowerMessage.includes('land')) {


    return "1. Core Legal Principles:\nProperty law governs ownership, tenancy, and dispute resolution regarding real property. It spans zoning regulations, title transfers, eminent domain, and landlord-tenant rights.\n\n2. Detailed Analysis:\nReal estate transactions rely heavily on the accuracy of title searches and legally binding deeds. Disputes frequently arise from unclear property lines, undisclosed defects, or contractual breaches during the purchase process.\n\n3. Potential Risks & Implications:\nFailing to conduct due diligence or relying on verbal agreements can result in loss of equity, structural liabilities, or severe litigation costs.\n\n4. Recommended Next Steps:\nAlways involve a title company and consider hiring an independent surveyor or inspector. Consult a real estate attorney for dispute resolution. This is not formal legal advice.";


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


    "1. Core Analysis & Principles:\nYour legal inquiry involves complexities that require a robust analysis. Legal systems function on localized precedent and statutory regulations, making broad assumptions inherently risky.\n\n2. Implications & Next Steps:\nWhile I can assist you with general educational concepts, the nuance of your situation necessitates expert review. I strongly advise gathering all pertinent documents and engaging a licensed attorney. (Note: This is not formal legal advice).",


    "1. Comprehensive Overview:\nEvery legal situation is unique, heavily dependent on specific facts, jurisdiction, and recently established case law. Navigating these intricacies without specialized knowledge can lead to procedural missteps.\n\n2. Recommendations:\nTo properly protect your rights and explore all viable avenues, please seek guidance from a qualified legal professional who can provide advice explicitly tailored to your case. (Note: This is not formal legal advice)."


  ];



  return helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];


}



app.listen(PORT, () => {


  console.log(`Justice AI Backend running on port ${PORT}`);


});



