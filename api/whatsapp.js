const twilio = require("twilio");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
require("dotenv").config();

const serviceAccount = require("../firebase-config.json");

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const twilioNumber = "whatsapp:+14155238886";

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

        let responseMessage = "";

        if (message.includes("hello")) {
            responseMessage = "🌍 Welcome to the Travel Assistant! Select a category:\n1️⃣ Restaurants\n2️⃣ Accommodation";
        } else if (message.includes("weather")) {
            responseMessage = await getWeather("Nairobi");
        } else {
            responseMessage = "Sorry, I didn't understand that.";
        }

        await client.messages.create({
            from: twilioNumber,
            to: sender,
            body: responseMessage,
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getWeather(city) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather API Error");
        const data = await response.json();
        return `Weather in ${city}: ${data.weather[0].description}, Temp: ${data.main.temp}°C`;
    } catch (error) {
        console.error("Error fetching weather:", error);
        return "Sorry, I couldn't fetch the weather right now.";
    }
}

module.exports = handler;
