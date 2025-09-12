import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";
import fs from "fs";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Carrega clientes e templates
const clients = JSON.parse(fs.readFileSync("./clients/client1.json", "utf-8"));
const templates = JSON.parse(fs.readFileSync("./templates/menu.json", "utf-8"));

// Função para gerar resposta automática
function getResponse(msg) {
  msg = msg.toLowerCase();

  if (msg.includes("produto")) return "📦 Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?";
  if (msg.includes("preço") || msg.includes("valor")) return "💲 Os preços variam conforme o produto. Qual item você quer?";
  if (msg.includes("desconto")) return "🎉 Temos promoções especiais! Qual produto te interessa?";
  if (msg.includes("pagamento") || msg.includes("pix")) return "💳 Aceitamos PIX, cartão e boleto.";
  if (msg.includes("entrega")) return "🚚 Entrega em 3 a 5 dias úteis.";
  if (msg.includes("garantia")) return "🛡️ Garantia de 12 meses.";
  if (msg.includes("contato") || msg.includes("whatsapp")) return "☎️ Fale conosco: (11) 99999-9999";
  if (msg.includes("horário") || msg.includes("horario")) return "⏰ Atendimento: Seg-Sáb 08:00-19:00";

  if (msg === "" || msg === "menu" || msg === "oi" || msg === "hello" || msg === "hi") {
    return `👋 Olá! Escolha uma das opções:\n${templates.menu.map((opt, i) => `${i+1}. ${opt}`).join("\n")}`;
  }

  return "❓ Não entendi. Digite 'menu' para ver as opções.";
}

// Endpoint do Twilio WhatsApp (multi-clientes)
app.post("/whatsapp/:clientId", (req, res) => {
  const clientId = req.params.clientId;
  const client = clients; // Para 1 cliente. Pode expandir para múltiplos
  if (!client) return res.status(404).send("Cliente não encontrado");

  const incomingMsg = req.body.Body || "";
  const reply = getResponse(incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Dashboard simples
app.get("/", (req, res) => {
  res.send("<h1>✅ Bot SaaS WhatsApp rodando. Endpoint: /whatsapp/:clientId</h1>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
