// index.js
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import Twilio from "twilio";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// -------------------- Twilio --------------------
const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// -------------------- Rotas --------------------

// Teste do bot
app.get("/", (req, res) => res.send("Bot rodando ✅"));

// Webhook Twilio (WhatsApp)
app.post("/webhook", async (req, res) => {
  try {
    const msgFrom = req.body.From;
    const msgBody = req.body.Body || "";

    console.log("Mensagem recebida do Twilio:", req.body);

    if (!msgFrom) return res.sendStatus(400);

    // Resposta fixa apenas para teste
    const reply = "🤖 Recebi sua mensagem! Em breve a IA vai responder aqui.";

    // Envia mensagem de volta
    await client.messages.create({
      from: TWILIO_NUMBER,
      to: msgFrom,
      body: reply,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro webhook Twilio:", err);
    res.sendStatus(500);
  }
});

// -------------------- Servidor --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
