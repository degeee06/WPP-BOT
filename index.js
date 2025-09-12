import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const responses = {
  "menu": "👋 Olá! Escolha:\n1️⃣ Produto\n2️⃣ Preço\n3️⃣ Desconto\n4️⃣ Pagamento",
  "produto": "📦 Temos diversos produtos. Quer ver nosso catálogo?",
  "preço": "💲 Os preços variam conforme o produto. Qual você quer?",
  "desconto": "🎉 Temos promoções especiais esta semana!",
  "default": "❓ Desculpe, não entendi. Digite *menu* para ver as opções."
};

function getResponse(msg) {
  msg = msg.toLowerCase();

  if (!msg || msg === "oi" || msg === "olá" || msg === "menu") return responses.menu;
  if (msg.includes("produto")) return responses.produto;
  if (msg.includes("preço") || msg.includes("valor")) return responses.preço;
  if (msg.includes("desconto") || msg.includes("promoção")) return responses.desconto;

  return responses.default;
}

app.post("/whatsapp", (req, res) => {
  const incomingMsg = req.body.Body || "";
  const reply = getResponse(incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

app.get("/", (req, res) => {
  res.send("Bot rodando no WhatsApp sandbox ✅");
});

app.listen(3000, () => console.log("✅ Servidor rodando na porta 3000"));
