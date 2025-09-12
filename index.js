import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ====================
// Configurações do Bot
// ====================
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const WHATSAPP_NUMBER = "whatsapp:+14155238886"; // Número Twilio Sandbox / Oficial

const responses = {
  produto: "📦 Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?",
  preco: "💲 Os preços variam conforme o produto. Qual item você está interessado?",
  desconto: "🎉 Temos promoções especiais esta semana! Me diga qual produto te interessa.",
  pagamento: "💳 Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto.",
  entrega: "🚚 O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento.",
  garantia: "🛡️ Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação.",
  contato: "☎️ Fale diretamente conosco pelo WhatsApp: (11) 99999-9999",
  horario: "⏰ Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas."
};

// ====================
// Função para enviar mensagem interativa
// ====================
async function sendInteractiveMessage(to) {
  try {
    await client.messages.create({
      from: WHATSAPP_NUMBER,
      to,
      content: [
        {
          type: "button",
          body: { text: "👋 Olá! Sou o assistente virtual. Escolha uma opção:" },
          action: {
            buttons: [
              { type: "reply", reply: { id: "produto", title: "Produtos" } },
              { type: "reply", reply: { id: "preco", title: "Preços" } },
              { type: "reply", reply: { id: "desconto", title: "Descontos" } },
              { type: "reply", reply: { id: "pagamento", title: "Pagamento" } },
              { type: "reply", reply: { id: "entrega", title: "Entrega" } },
              { type: "reply", reply: { id: "garantia", title: "Garantia" } },
              { type: "reply", reply: { id: "contato", title: "Contato" } },
              { type: "reply", reply: { id: "horario", title: "Horário" } }
            ]
          }
        }
      ]
    });
  } catch (err) {
    console.error("Erro ao enviar mensagem interativa:", err);
  }
}

// ====================
// Endpoint Twilio WhatsApp
// ====================
app.post("/whatsapp", async (req, res) => {
  const from = req.body.From;  // Número do usuário que enviou a mensagem
  const body = req.body.Body?.trim().toLowerCase();

  // Se mensagem vazia ou menu, envia botões
  if (!body || body === "menu" || body === "oi" || body === "hello") {
    await sendInteractiveMessage(from);
  } else {
    // Responde com mensagem de acordo com a opção clicada
    const reply = responses[body] || "❓ Desculpe, não entendi. Digite *menu* para ver as opções.";

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);

    res.writeHead(200, { "Content-Type": "text/xml" });
    return res.end(twiml.toString());
  }

  res.writeHead(200);
  res.end("OK");
});

// ====================
// Teste via navegador
// ====================
app.get("/", (req, res) => {
  res.send("🤖 Bot WhatsApp interativo funcionando no Render ✅");
});

// ====================
// Iniciar servidor
// ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot rodando na porta ${PORT}`));
