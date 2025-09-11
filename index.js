// index.js
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import Twilio from "twilio";
import axios from "axios";

dotenv.config();
const app = express();

// Suporte para JSON e x-www-form-urlencoded (Twilio envia assim)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// -------------------- Twilio --------------------
const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = "whatsapp:+14155238886"; // use seu sandbox com whatsapp:

// -------------------- Hugging Face (leve) --------------------
async function gerarResposta(prompt) {
  try {
    const res = await axios.post(
      'https://api-inference.huggingface.co/models/openai/gpt-oss-20b',
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );
    return res.data[0]?.generated_text || 'Não consegui entender sua mensagem.';
  } catch (err) {
    console.error('Erro ao gerar resposta:', err);
    return 'Ocorreu um erro ao processar sua solicitação.';
  }
}


// -------------------- Rotas --------------------
app.get("/", (req, res) => res.send("Bot rodando ✅"));

app.post("/webhook", async (req, res) => {
  try {
    const msgFrom = req.body.From;
    const msgBody = req.body.Body || "";

    console.log("Mensagem recebida do Twilio:", req.body);

    if (!msgFrom) return res.sendStatus(400);

    // Gera resposta via IA
    const reply = await gerarRespostaHF(msgBody);

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


