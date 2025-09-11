import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import twilio from "twilio";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(bodyParser.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Servir HTML
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Endpoint para enviar WhatsApp
app.post("/send", async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).send("Número ou mensagem inválidos");

    try {
        await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+${phone}`,
            body: message
        });
        res.status(200).send("Mensagem enviada");
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao enviar mensagem");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
