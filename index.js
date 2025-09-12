import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const whatsappFrom = "whatsapp:+14155238886"; // número Twilio sandbox

// Respostas do bot
const responses = {
  "menu": "👋 Olá! Sou o assistente virtual.\nEscolha uma opção:\n1️⃣ Produto\n2️⃣ Preço\n3️⃣ Desconto\n4️⃣ Pagamento\n5️⃣ Entrega\n6️⃣ Garantia\n7️⃣ Contato\n8️⃣ Horário",
  "produto": "📦 Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?",
  "preço": "💲 Os preços variam conforme o produto. Qual item você está interessado?",
  "desconto": "🎉 Temos promoções especiais esta semana! Me diga qual produto te interessa.",
  "pagamento": "💳 Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto.",
  "pix": "Vou preparar o pagamento via PIX para você...",
  "entrega": "🚚 O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento.",
  "garantia": "🛡️ Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação.",
  "contato": "☎️ Você pode falar diretamente conosco pelo WhatsApp: (11) 99999-9999",
  "horario": "⏰ Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
  "ajuda": "Precisa de ajuda imediata? Nosso time está disponível agora no WhatsApp.",
  "default": "❓ Desculpe, não entendi. Digite *menu* para ver as opções."
};

// Função para mapear mensagem do usuário para resposta
function getResponse(msg) {
  msg = msg.toLowerCase();

  if (msg === "" || msg === "oi" || msg === "olá" || msg === "hello" || msg === "hi" || msg === "menu") {
    return responses.menu;
  }

  if (msg.includes("produto") || msg.includes("catálogo") || msg.includes("catalogo")) return responses.produto;
  if (msg.includes("preço") || msg.includes("valor")) return responses.preço;
  if (msg.includes("desconto") || msg.includes("promoção")) return responses.desconto;
  if (msg.includes("pagamento") || msg.includes("pagar")) return responses.pagamento;
  if (msg.includes("pix")) return responses.pix;
  if (msg.includes("entrega") || msg.includes("prazo")) return responses.entrega;
  if (msg.includes("garantia")) return responses.garantia;
  if (msg.includes("contato") || msg.includes("whatsapp") || msg.includes("telefone") || msg.includes("número") || msg.includes("numero")) return responses.contato;
  if (msg.includes("horário") || msg.includes("horario") || msg.includes("atendimento") || msg.includes("funcionamento")) return responses.horario;
  if (msg.includes("ajuda") || msg.includes("suporte") || msg.includes("emergência") || msg.includes("emergencia")) return responses.ajuda;

  return responses.default;
}

// Função para enviar mensagem interativa (botões)
async function sendInteractiveMessage(to, bodyText, options = []) {
  try {
    const message = await client.messages.create({
      from: whatsappFrom,
      to: to,
      contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e", // Seu template sandbox
      contentVariables: JSON.stringify({ "1": bodyText })
    });
    console.log("Mensagem enviada SID:", message.sid);
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err.message);
  }
}

// Endpoint Twilio webhook
app.post("/whatsapp", async (req, res) => {
  const incomingMsg = req.body.Body || "";
  const from = req.body.From;

  const reply = getResponse(incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  // Enviar botão/menu interativo usando template
  // sendInteractiveMessage(from, reply, ["Produto", "Preço", "Desconto"]);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Endpoint teste navegador
app.get("/", (req, res) => {
  res.send("🤖 Bot WhatsApp rodando ✅");
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot rodando na porta ${PORT}`));
