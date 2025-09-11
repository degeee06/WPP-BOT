// index.js
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import Twilio from "twilio";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// Suporte para JSON e x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir front-end
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// -------------------- Twilio --------------------
const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_NUMBER || "whatsapp:+14155238886";

// -------------------- Hugging Face --------------------
async function gerarResposta(prompt) {
  try {
    const res = await axios.post(
      'https://api-inference.huggingface.co/models/bigscience/bloomz-560m', // modelo gratuito
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );

    if (Array.isArray(res.data) && res.data[0]?.generated_text) {
      return res.data[0].generated_text;
    } else if (res.data?.generated_text) {
      return res.data.generated_text;
    } else {
      return 'Desculpe, não consegui entender sua mensagem.';
    }
  } catch (err) {
    console.error('Erro ao gerar resposta:', err.response?.data || err.message);
    return 'Ocorreu um erro ao processar sua solicitação.';
  }
}

// -------------------- Rotas --------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Rota para front-end
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "Mensagem vazia" });

    const reply = await gerarResposta(message);
    res.json({ reply });
  } catch (err) {
    console.error("Erro no chat:", err);
    res.status(500).json({ reply: "Erro ao processar mensagem." });
  }
});

// Webhook Twilio (WhatsApp)
app.post("/webhook", async (req, res) => {
  try {
    const msgFrom = req.body.From;
    const msgBody = req.body.Body || "";

    if (!msgFrom) return res.sendStatus(400);

    const reply = await gerarResposta(msgBody);

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
