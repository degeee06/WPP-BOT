// index.js
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import Twilio from "twilio";
import axios from "axios";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// -------------------- Supabase --------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -------------------- Twilio --------------------
const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// -------------------- Hugging Face (leve e grátis) --------------------
async function gerarRespostaHF(prompt) {
  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-small",
      { inputs: prompt },
      {
        headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
        timeout: 15000 // 15s limite
      }
    );
    // Flan-T5 retorna array de objetos
    return res.data[0]?.generated_text || "🤖 Não consegui gerar resposta.";
  } catch (err) {
    console.error("Erro Hugging Face:", err.response?.data || err.message);
    return "🤖 Ocorreu um erro ao gerar a resposta.";
  }
}

// -------------------- Rotas --------------------
app.get("/", (req, res) => res.send("Bot rodando ✅"));

app.post("/webhook", async (req, res) => {
  try {
    const msgFrom = req.body.From;
    const msgBody = req.body.Body || "";
    if (!msgFrom) return res.sendStatus(400);

    let { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", msgFrom)
      .maybeSingle();

    const hoje = new Date().toISOString().split("T")[0];

    if (!lead) {
      const { data: newLead } = await supabase
        .from("leads")
        .insert({
          name: "Cliente WhatsApp",
          phone: msgFrom,
          message: msgBody,
          paid: false,
          msg_count: 0,
          last_msg_date: hoje
        })
        .select()
        .single();
      lead = newLead || { msg_count: 0, last_msg_date: hoje };
    }

    if (lead.last_msg_date !== hoje) {
      await supabase
        .from("leads")
        .update({ msg_count: 0, last_msg_date: hoje })
        .eq("id", lead.id);
      lead.msg_count = 0;
    }

    if (!lead.paid && lead.msg_count >= 10) {
      await client.messages.create({
        from: TWILIO_NUMBER,
        to: msgFrom,
        body: `🚀 Limite diário de 10 mensagens grátis atingido.\nUpgrade VIP: ${process.env.MP_PAYMENT_LINK}`
      });
      return res.sendStatus(200);
    }

    const reply = await gerarRespostaHF(msgBody);

    await client.messages.create({
      from: TWILIO_NUMBER,
      to: msgFrom,
      body: reply,
    });

    await supabase
      .from("leads")
      .update({ msg_count: (lead.msg_count || 0) + 1 })
      .eq("id", lead.id);

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro webhook Twilio:", err);
    res.sendStatus(500);
  }
});

app.post("/mp-webhook", async (req, res) => {
  try {
    if (req.query.token !== process.env.MP_WEBHOOK_TOKEN) return res.status(403).send("Forbidden");

    const data = req.body;
    if (data.type === "payment" || data.type === "preapproval") {
      const payerEmail = data.data?.payer?.email || data.data?.payer_email;
      if (payerEmail) {
        await supabase.from("leads").update({ paid: true }).eq("email", payerEmail);
        const { data: lead } = await supabase
          .from("leads")
          .select("phone")
          .eq("email", payerEmail)
          .maybeSingle();
        if (lead?.phone) {
          await client.messages.create({
            from: TWILIO_NUMBER,
            to: lead.phone,
            body: "Pagamento recebido ✅ Obrigado pelo Pix!"
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
