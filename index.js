import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Respostas fixas do bot
const responses = {
  "servicos": "Nossos serviços disponíveis são: Cromoterapia, Massagem Relaxante, Design de Unhas e Tratamentos Corporais.",
  "produto": "Temos diversos produtos disponíveis. Quer ver nosso catálogo?",
  "cromoterapia": "A cromoterapia utiliza cores para restaurar o equilíbrio energético do corpo. Sessões de 30 a 60 minutos.",
  "massagem": "Nossa massagem relaxante combina técnicas suecas e aromaterapia para aliviar tensões. Sessões de 50 ou 80 minutos.",
  "unhas": "Oferecemos serviços de unhas: Alongamento, Manicure, Pedicure, Esmaltação em gel e Decoração artística. Pacotes mensais com desconto disponíveis.",
  "preco": "Os preços variam conforme o produto ou serviço. Qual item você quer saber?",
  "desconto": "Temos promoções especiais esta semana! Produtos com até 30% de desconto e serviços com 10% off.",
  "pagamento": "Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto. Quer prosseguir com o pagamento?",
  "pix": "Vou preparar o pagamento via PIX para você...",
  "entrega": "O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento. Serviços podem ser agendados imediatamente.",
  "garantia": "Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação. Serviços têm garantia de 7 dias.",
  "contato": "Você pode falar diretamente conosco pelo WhatsApp: (11) 99999-9999",
  "whatsapp": "Nosso WhatsApp é (11) 99999-9999. Clique no botão verde no canto inferior direito para falar diretamente conosco!",
  "ajuda": "Precisa de ajuda imediata? Fale conosco pelo WhatsApp: (11) 99999-9999",
  "horario": "Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
  "data": "Hoje é " + new Date().toLocaleDateString("pt-BR") + ".",
  "default": "Desculpe, não entendi. Poderia reformular sua pergunta?"
};

// Função para processar mensagem recebida
function getResponse(msg) {
  msg = msg.toLowerCase();

  if (msg.includes("atendimento") || msg.includes("serviço") || msg.includes("servicos") || msg.includes("cromoterapia") || msg.includes("massagem") || msg.includes("unha")) return responses.servicos;
  if (msg.includes("produto")) return responses.produto;
  if (msg.includes("catálogo") || msg.includes("catalogo")) return responses.catalogo;
  if (msg.includes("cromoterapia") || msg.includes("cor") || msg.includes("cores")) return responses.cromoterapia;
  if (msg.includes("massagem") || msg.includes("relaxante") || msg.includes("relaxar")) return responses.massagem;
  if (msg.includes("unha") || msg.includes("unhas") || msg.includes("manicure") || msg.includes("pedicure")) return responses.unhas;
  if (msg.includes("preço") || msg.includes("valor")) return responses.preco;
  if (msg.includes("desconto") || msg.includes("promoção") || msg.includes("promocao") || msg.includes("oferta")) return responses.desconto;
  if (msg.includes("pagamento") || msg.includes("pagar") || msg.includes("pix")) return responses.pix;
  if (msg.includes("entrega") || msg.includes("prazo")) return responses.entrega;
  if (msg.includes("garantia")) return responses.garantia;
  if (msg.includes("contato") || msg.includes("telefone") || msg.includes("número") || msg.includes("numero")) return responses.contato;
  if (msg.includes("whatsapp")) return responses.whatsapp;
  if (msg.includes("ajuda") || msg.includes("suporte") || msg.includes("emergência") || msg.includes("emergencia")) return responses.ajuda;
  if (msg.includes("horário") || msg.includes("horario") || msg.includes("atendimento")) return responses.horario;
  if (msg.includes("data") || msg.includes("dia")) return responses.data;

  return responses.default;
}

// Endpoint Twilio → WhatsApp
app.post("/whatsapp", (req, res) => {
  const incomingMsg = req.body.Body || "";
  const reply = getResponse(incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot rodando na porta ${PORT}`));

