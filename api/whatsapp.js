const twilio = require("twilio");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
require("dotenv").config();

const serviceAccount = require("../firebase-config.json");

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioNumber = "whatsapp:+14155238886";

async function handler(req, res) {
    if (req.method === "POST") {
        const message = req.body.Body.toLowerCase();
        const sender = req.body.From;
        let responseMessage = "";

        if (message.includes("hello")) {
            responseMessage = "🌍 Welcome to the Travel Assistant! Select a category:\n1️⃣ Restaurants\n2️⃣ Accommodation\n...";
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
    } else {
        res.status(405).send("Method Not Allowed");
    }
}

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

module.exports = handler;
