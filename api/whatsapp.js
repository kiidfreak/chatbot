const twilio = require("twilio");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const OpenAI = require("openai");
require("dotenv").config();

const serviceAccount = require("../firebase-config.json");

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioNumber = "whatsapp:+14155238886";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        const message = req.body.Body?.toLowerCase();
        const sender = req.body.From;

        if (!message) {
            return res.status(400).json({ error: "Invalid message format" });
        }

        let responseMessage = await getAIResponse(message);

        await client.messages.create({
            from: twilioNumber,
            to: sender,
            body: responseMessage,
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error handling request:", error.message, error.stack);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}

async function getAIResponse(userMessage) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful AI-powered travel assistant for WhatsApp users. Help users with travel advice, weather, restaurant recommendations, and accommodations." },
                { role: "user", content: userMessage },
            ],
            max_tokens: 200,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return "Sorry, I'm having trouble generating a response right now.";
    }
}

module.exports = handler;
