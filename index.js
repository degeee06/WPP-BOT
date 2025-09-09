require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');
const axios = require('axios');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Config OpenAI
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

// Config Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Config Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// Prompt base GPT
const basePrompt = `
Você é um assistente virtual de imobiliária.
Responda dúvidas sobre imóveis, colete nome, telefone e e-mail.
Se o cliente não pagou, informe que precisa pagar a assinatura via PIX.
`;

// Função extrair dados do cliente
function extractClientData(msg) {
  const phone = msg.match(/\+?\d{10,15}/)?.[0] || null;
  const email = msg.match(/\S+@\S+\.\S+/)?.[0] || null;
  const name = msg.match(/meu nome é (\w+)/i)?.[1] || null;
  const property = msg.match(/(apartamento|casa|sala)/i)?.[0] || null;
  const time = msg.match(/(\d{1,2}h|\d{1,2}:\d{2})/i)?.[0] || null;
  return { name, phone, email, property_interest: property, preferred_time: time };
}

// Criar link Pix Mercado Pago
async function criarAssinaturaPix(nome, email) {
  try {
    const res = await axios.post('https://api.mercadopago.com/preapproval', {
      reason: "Chatbot Imobiliária - Mensalidade",
      payer_email: email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 200,
        currency_id: "BRL",
        start_date: new Date().toISOString(),
        end_date: null,
        payment_methods: ["pix"]
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data.init_point;
  } catch (err) {
    console.error(err.response?.data || err.message);
    return null;
  }
}

// Webhook Twilio - Receber mensagens
app.post('/webhook', async (req, res) => {
  const msg = req.body.Body;
  const from = req.body.From;

  try {
    // Verificar se lead já existe
    const { data: lead, error } = await supabase.from('leads').select('*').eq('phone', from).single();

    const clientData = extractClientData(msg);

    if (!lead) {
      // Novo cliente → inserir não pago
      await supabase.from('leads').insert([{
        name: clientData.name,
        phone: from,
        email: clientData.email,
        property_interest: clientData.property_interest,
        preferred_time: clientData.preferred_time,
        message: msg,
        paid: false
      }]);

      const linkPix = await criarAssinaturaPix(clientData.name || "Cliente", clientData.email || "email@teste.com");

      await client.messages.create({
        from: TWILIO_NUMBER,
        to: from,
        body: `Olá ${clientData.name || ''}! Para ativar seu chatbot imobiliário, pague a assinatura mensal via PIX:\n${linkPix}`
      });
    } else if (!lead.paid) {
      // Lead existente não pago → reenviar link PIX
      const linkPix = await criarAssinaturaPix(clientData.name || "Cliente", clientData.email || "email@teste.com");

      await client.messages.create({
        from: TWILIO_NUMBER,
        to: from,
        body: `Você ainda não completou o pagamento. Use este link para pagar via PIX:\n${linkPix}`
      });
    } else {
      // Lead pago → responder via GPT
      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: basePrompt },
          { role: "user", content: msg }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const reply = completion.data.choices[0].message.content.trim();

      await client.messages.create({
        from: TWILIO_NUMBER,
        to: from,
        body: reply
      });
    }

    res.send('<Response></Response>');
  } catch (err) {
    console.error(err);
    res.status(500).send('<Response></Response>');
  }
});

// Webhook Mercado Pago - pagamento confirmado
app.post('/mp-webhook', async (req, res) => {
  const data = req.body;

  if (data.type === "payment" || data.type === "preapproval") {
    const payerEmail = data.data?.payer?.email || data.data?.payer_email;
    await supabase.from('leads').update({ paid: true }).eq('email', payerEmail);
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT, () => console.log(`Servidor rodando na porta ${process.env.PORT}`));
