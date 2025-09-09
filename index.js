// index.js
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";
import Twilio from "twilio";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// -------------------- Supabase --------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -------------------- OpenAI --------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------- Twilio --------------------
const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// -------------------- Rotas --------------------

// Rota principal para teste
app.get("/", (req, res) => {
  res.send("Bot rodando ✅");
});

// Webhook Twilio (WhatsApp)
app.post("/webhook", async (req, res) => {
  try {
    const msgFrom = req.body.From;
    const msgBody = req.body.Body || req.body.body || "";

    // Evita erro se msgBody estiver vazio
    const emailMatch = msgBody ? msgBody.match(/[\w.-]+@[\w.-]+\.\w+/) : null;
    const email = emailMatch ? emailMatch[0] : null;

    if (email) {
      await supabase
        .from("leads")
        .insert({
          name: "Cliente WhatsApp",
          phone: msgFrom,
          email: email,
          message: msgBody
        })
        .onConflict("email")
        .ignore();
    }

    // Resposta GPT
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: msgBody }],
    });

    const reply = gptResponse.choices[0].message.content;

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


// Webhook Mercado Pago
app.post("/mp-webhook", async (req, res) => {
  try {
    const tokenRecebido = req.query.token;
    if (tokenRecebido !== process.env.MP_WEBHOOK_TOKEN) {
      return res.status(403).send("Forbidden");
    }

    const data = req.body;

    if (data.type === "payment" || data.type === "preapproval") {
      const payerEmail = data.data?.payer?.email || data.data?.payer_email;

      // Atualiza lead no Supabase
      const { error } = await supabase
        .from("leads")
        .update({ paid: true })
        .eq("email", payerEmail);

      if (error) console.error("Erro ao atualizar Supabase:", error);

      // Envia mensagem de confirmação via WhatsApp
      if (payerEmail) {
        const { data: lead } = await supabase
          .from("leads")
          .select("phone")
          .eq("email", payerEmail)
          .single();

        if (lead?.phone) {
          await client.messages.create({
            from: TWILIO_NUMBER,
            to: lead.phone,
            body: "Pagamento recebido com sucesso! ✅ Obrigado pelo seu Pix."
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro webhook MP:", err);
    res.sendStatus(500);
  }
});

// -------------------- Servidor --------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

