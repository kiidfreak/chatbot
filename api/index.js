const express = require("express");
const whatsappHandler = require("./whatsapp");
const app = express();

app.use(express.json());

app.post("/api/whatsapp", whatsappHandler);

app.get("/api", (req, res) => {
    res.send("Welcome to the WhatsApp Chatbot API!");
});

module.exports = app;
