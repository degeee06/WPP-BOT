import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Menu básico direto no código
const menu = ["Produto", "Preço", "Desconto", "Pagamento", "Entrega", "Garantia", "Contato", "Horário"];

// Função de resposta automática
function getResponse(msg) {
  msg = msg.toLowerCase();

  if (msg.includes("produto")) return "📦 Temos diversos produtos disponíveis.";
  if (msg.includes("preço") || msg.includes("valor")) return "💲 Os preços variam conforme o produto.";
  if (msg.includes("desconto")) return "🎉 Temos promoções especiais!";
  if (msg.includes("pagamento") || msg.includes("pix")) return "💳 Aceitamos PIX, cartão e boleto.";
  if (msg.includes("entrega")) return "🚚 Entrega em 3 a 5 dias úteis.";
  if (msg.includes("garantia")) return "🛡️ Garantia de 12 meses.";
  if (msg.includes("contato") || msg.includes("whatsapp")) return "☎️ Fale conosco: (11) 99999-9999";
  if (msg.includes("horário") || msg.includes("horario")) return "⏰ Atendimento: Seg-Sáb 08:00-19:00";

  if (msg === "" || msg === "menu" || msg === "oi" || msg === "hello" || msg === "hi") {
    return `👋 Olá! Escolha uma das opções:\n${menu.map((opt, i) => `${i+1}. ${opt}`).join("\n")}`;
  }

  return "❓ Não entendi. Digite 'menu' para ver as opções.";
}

// Endpoint WhatsApp genérico
app.post("/whatsapp", (req, res) => {
  const incomingMsg = req.body.Body || "";
  const reply = getResponse(incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Dashboard simples
app.get("/", (req, res) => {
  res.send("<h1>✅ Bot WhatsApp rodando. Endpoint: /whatsapp</h1>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
