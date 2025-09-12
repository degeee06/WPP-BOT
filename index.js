import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Respostas do bot
const responses = {
  "produto": "📦 Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?",
  "catalogo": "Aqui está nosso catálogo: [link do catálogo]. Posso te ajudar com mais alguma coisa?",
  "preço": "💲 Os preços variam conforme o produto. Qual item você está interessado?",
  "desconto": "🎉 Temos promoções especiais esta semana! Me diga qual produto te interessa.",
  "pagamento": "💳 Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto.",
  "pix": "Vou preparar o pagamento via PIX para você...",
  "entrega": "🚚 O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento.",
  "garantia": "🛡️ Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação.",
  "contato": "☎️ Você pode falar diretamente conosco pelo WhatsApp: (11) 99999-9999",
  "whatsapp": "Nosso WhatsApp é (11) 99999-9999.",
  "ajuda": "Precisa de ajuda imediata? Nosso time está disponível agora no WhatsApp.",
  "horario": "⏰ Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
  "default": "❓ Desculpe, não entendi. Digite *menu* para ver as opções."
};

// Função para processar a mensagem recebida
function getResponse(msg) {
  msg = msg.toLowerCase();

  if (msg.includes("produto") || msg.includes("catálogo") || msg.includes("catalogo")) return responses.produto;
  if (msg.includes("preço") || msg.includes("valor")) return responses.preço;
  if (msg.includes("desconto") || msg.includes("promoção")) return responses.desconto;
  if (msg.includes("pagamento") || msg.includes("pagar")) return responses.pagamento;
  if (msg.includes("pix")) return responses.pix;
  if (msg.includes("entrega") || msg.includes("prazo")) return responses.entrega;
  if (msg.includes("garantia")) return responses.garantia;
  if (msg.includes("contato") || msg.includes("whatsapp") || msg.includes("telefone") || msg.includes("número") || msg.includes("numero")) return responses.contato;
  if (msg.includes("ajuda") || msg.includes("suporte") || msg.includes("emergência") || msg.includes("emergencia")) return responses.ajuda;
  if (msg.includes("horário") || msg.includes("horario") || msg.includes("atendimento") || msg.includes("funcionamento")) return responses.horario;

  if (msg === "" || msg === "menu" || msg === "oi" || msg === "hello" || msg === "hi") {
    // Mensagem inicial ou menu
    return "👋 Olá! Sou o assistente virtual.\nDigite uma das opções:\n- Produto\n- Preço\n- Desconto\n- Pagamento\n- Entrega\n- Garantia\n- Contato\n- Horário";
  }

  return responses.default;
}

// Endpoint do Twilio WhatsApp
app.post("/whatsapp", (req, res) => {
  const incomingMsg = req.body.Body || "";
  const reply = getResponse(incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Teste no navegador
app.get("/", (req, res) => {
  res.send("Bot WhatsApp funcionando ✅");
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot rodando na porta ${PORT}`));
