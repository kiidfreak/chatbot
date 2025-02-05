const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio Credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = "whatsapp:+14155238886";
const client = new twilio(accountSid, authToken);

// Firebase Setup
const serviceAccount = require('./firebase-config.json');
admin.initializeApp({ credential: admin.credential.cert(require("./firebase-config.json")) });
const db = admin.firestore();

// OpenAI API Key
const openaiApiKey = process.env.OPENAI_API_KEY;

app.post("/whatsapp", async (req, res) => {
    const message = req.body.Body.toLowerCase();
    const sender = req.body.From;
    let responseMessage = "";

    if (message.includes("hello")) {
        responseMessage = "🌍 Welcome to the Travel Assistant! Select a category:\n1️⃣ Restaurants\n2️⃣ Accommodation\n3️⃣ Activities\n4️⃣ Entertainment\n5️⃣ Shopping\n6️⃣ Transport\n7️⃣ Weather\n8️⃣ Itinerary Planner";
    } else if (message.includes("weather")) {
        responseMessage = await getWeather("Nairobi");
    } else if (message.match(/^(1|restaurants)$/)) {
        responseMessage = await getCategory("restaurants");
    } else if (message.match(/^(6|transport)$/)) {
        responseMessage = "Do you prefer self-drive or a driver? Reply with \"self-drive\" or \"driver\".";
    } else if (message.includes("self-drive")) {
        responseMessage = await getCategory("car_hires");
    } else if (message.includes("driver")) {
        responseMessage = await getCategory("taxis");
    } else if (message.includes("itinerary")) {
        responseMessage = "Please provide your budget, and I'll generate an itinerary for you!";
    } else {
        responseMessage = await getAIResponse(message);
    }

    await client.messages.create({
        from: twilioNumber,
        to: sender,
        body: responseMessage,
    });

    res.sendStatus(200);
});

async function getWeather(city) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return `Weather in ${city}: ${data.weather[0].description}, Temp: ${data.main.temp}°C`;
    } catch (error) {
        return "Sorry, I couldn't fetch the weather right now.";
    }
}

async function getCategory(category) {
    const snapshot = await db.collection(category).limit(3).get();
    let response = `Here are some ${category} options:\n`;
    snapshot.forEach(doc => {
        const data = doc.data();
        response += `📍 ${data.name}\n⭐ Reviews: ${data.reviews}\n💰 Price: ${data.price}\n📍 Location: ${data.location}\n\n`;
    });
    return response || "No data found.";
}

async function getAIResponse(prompt) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "system", content: "You are a travel assistant." }, { role: "user", content: prompt }],
        }),
    });
    const json = await res.json();
    return json.choices[0].message.content;
}


// Define a route for the home page
app.get("/", (req, res) => {
    res.send("Welcome to the WhatsApp Chatbot!");
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Chatbot is running on port ${PORT}`);
});
