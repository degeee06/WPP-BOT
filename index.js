import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Configurações Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Respostas fixas (mesmo do HTML)
const responses = {
  "produto": "Temos diversos produtos e serviços disponíveis. Posso te mostrar nossos catálogos?",
  "catalogo": "Temos vários catálogos disponíveis:\n- Catálogo de Produtos: [link do catálogo]\n- Catálogo de Serviços: [link do catálogo]\nQual você gostaria de ver?",
  "servicos": "Nossos principais serviços são:\n- Cromoterapia\n- Massagem Relaxante\n- Design de Unhas\nGostaria de saber mais sobre algum específico?",
  "cromoterapia": "A cromoterapia utiliza cores para restaurar o equilíbrio energético do corpo. Sessões de 30 a 60 minutos.",
  "massagem": "Nossa massagem relaxante combina técnicas suecas e aromaterapia. Sessões de 50 ou 80 minutos.",
  "unhas": "Serviços de unhas: Alongamento, Manicure, Pedicure, Esmaltação e Decoração. Pacotes mensais com desconto!",
  "preço": "Os preços variam conforme o produto ou serviço. Qual item você quer saber?",
  "desconto": "Temos promoções especiais esta semana! Serviços com 10% off e produtos até 30% off.",
  "pagamento": "Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto.",
  "pix": "Vou preparar o pagamento via PIX para você...",
  "entrega": "Produtos: 3 a 5 dias úteis após confirmação do pagamento. Serviços: agendamento imediato.",
  "garantia": "Produtos têm garantia de 12 meses. Serviços têm garantia de 7 dias.",
  "contato": "Fale conosco pelo WhatsApp: (11) 99999-9999",
  "whatsapp": "Nosso WhatsApp: (11) 99999-9999. Clique no botão verde na tela para falar conosco!",
  "ajuda": "Precisa de ajuda imediata? Nosso time está disponível no WhatsApp.",
  "horario": "Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
  "data": `Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}.`,
  "default": "Desculpe, não entendi. Poderia reformular sua pergunta?"
};

// Função para processar mensagem
function getResponse(msg) {
  msg = msg.toLowerCase();

  if (msg.includes("produto") || msg.includes("catálogo")) return responses.produto;
  if (msg.includes("catalogo")) return responses.catalogo;
  if (msg.includes("serviço") || msg.includes("servico") || msg.includes("massagem") || msg.includes("cromoterapia") || msg.includes("unha")) return responses.servicos;
  if (msg.includes("cromoterapia") || msg.includes("cor") || msg.includes("cores")) return responses.cromoterapia;
  if (msg.includes("massagem") || msg.includes("relaxante") || msg.includes("relaxar")) return responses.massagem;
  if (msg.includes("unha") || msg.includes("unhas") || msg.includes("manicure") || msg.includes("pedicure")) return responses.unhas;
  if (msg.includes("preço") || msg.includes("valor")) return responses.preço;
  if (msg.includes("desconto") || msg.includes("promoção")) return responses.desconto;
  if (msg.includes("pagamento") || msg.includes("pagar") || msg.includes("pix")) return responses.pix;
  if (msg.includes("entrega") || msg.includes("prazo")) return responses.entrega;
  if (msg.includes("garantia")) return responses.garantia;
  if (msg.includes("contato") || msg.includes("whatsapp") || msg.includes("telefone") || msg.includes("numero") || msg.includes("número")) return responses.whatsapp;
  if (msg.includes("ajuda") || msg.includes("suporte") || msg.includes("emergência") || msg.includes("emergencia")) return responses.ajuda;
  if (msg.includes("horário") || msg.includes("horario") || msg.includes("atendimento") || msg.includes("funcionamento")) return responses.horario;
  if (msg.includes("que dia") || msg.includes("data")) return responses.data;

  return responses.default;
}

// Endpoint Twilio → WhatsApp
app.post("/whatsapp", async (req, res) => {
  const incomingMsg = req.body.Body || "";
  const twiml = new twilio.twiml.MessagingResponse();

  const reply = getResponse(incomingMsg);
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot empresarial rodando na porta ${PORT}`));
