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
  "whatsapp": "Nosso WhatsApp é (11) 99999-9999. Clique no botão verde para falar diretamente!",
  "ajuda": "Precisa de ajuda imediata? Fale conosco pelo WhatsApp: (11) 99999-9999",
  "horario": "⏰ Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
  "atendente": "👤 Você será transferido para nosso atendente humano: https://wa.me/5511999999999",
  "default": "❓ Desculpe, não entendi. Digite *menu* para ver as opções."
};

// Menu inicial interativo
const menuMessage = `👋 Olá! Sou o assistente virtual.
Digite o número da opção desejada:
1 - Produtos
2 - Preço
3 - Desconto
4 - Pagamento
5 - Entrega
6 - Garantia
7 - Contato
8 - Horário
9 - Falar com atendente`;

// Função para processar a mensagem recebida
function getResponse(msg) {
  msg = msg.trim().toLowerCase();

  // Menu inicial ou cumprimentos
  if (msg === "" || msg === "menu" || msg === "oi" || msg === "olá" || msg === "hello" || msg === "hi") {
    return menuMessage;
  }

  // Opções por número
  switch (msg) {
    case "1": return responses.produto;
    case "2": return responses.preço;
    case "3": return responses.desconto;
    case "4": return responses.pagamento;
    case "5": return responses.entrega;
    case "6": return responses.garantia;
    case "7": return responses.contato;
    case "8": return responses.horario;
    case "9": return responses.atendente;
  }

  // Mensagens por palavra-chave
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
  if (msg.includes("atendente") || msg.includes("humano")) return responses.atendente;

  // Fallback rápido
  return responses.default;
}

// Endpoint do Twilio para WhatsApp
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
