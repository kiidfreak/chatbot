const express = require("express");
const bodyParser = require("body-parser");
const whatsappHandler = require("./whatsapp"); // Assuming your file is named whatsapp.js


require("dotenv").config();
const twilio = require("twilio");

console.log("Twilio Account SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Twilio Auth Token:", process.env.TWILIO_AUTH_TOKEN);

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
client.api.accounts(process.env.TWILIO_ACCOUNT_SID)
    .fetch()
    .then(account => console.log("Twilio Account Verified:", account.friendlyName))
    .catch(error => console.error("Twilio Authentication Failed:", error));



const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/api/whatsapp", whatsappHandler);


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
