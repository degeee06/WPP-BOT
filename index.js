import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ================================
// Respostas fixas (robusto para empresas)
// ================================
const responses = {
  "servicos": "Nossos serviços disponíveis são: Cromoterapia, Massagem Relaxante, Design de Unhas e Tratamentos Corporais.",
  "produto": "Temos diversos produtos disponíveis. Quer ver nosso catálogo?",
  "catalogo": "Temos vários catálogos disponíveis:<br>- Catálogo de Produtos: [link]<br>- Catálogo de Serviços: [link]",
  "cromoterapia": "A cromoterapia utiliza cores para restaurar o equilíbrio energético do corpo. Sessões de 30 a 60 minutos.",
  "massagem": "Nossa massagem relaxante combina técnicas suecas e aromaterapia para aliviar tensões. Sessões de 50 ou 80 minutos.",
  "unhas": "Serviços de unhas: Alongamento, Manicure, Pedicure, Esmaltação em gel e Decoração artística. Pacotes mensais com desconto disponíveis.",
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

// ================================
// Mapeamento de perguntas/vinculação de palavras-chave
// ================================
const keywords = [
  { words: ["atendimento", "serviço", "servicos", "cromoterapia", "massagem", "unha", "unhas"], response: "servicos" },
  { words: ["produto", "produtos"], response: "produto" },
  { words: ["catalogo", "catálogo"], response: "catalogo" },
  { words: ["cromoterapia", "cor", "cores"], response: "cromoterapia" },
  { words: ["massagem", "relaxante", "relaxar"], response: "massagem" },
  { words: ["unha", "unhas", "manicure", "pedicure"], response: "unhas" },
  { words: ["preço", "precos", "valor", "valores"], response: "preco" },
  { words: ["desconto", "promoção", "promocao", "oferta"], response: "desconto" },
  { words: ["pagamento", "pagar", "pix"], response: "pix" },
  { words: ["entrega", "prazo"], response: "entrega" },
  { words: ["garantia"], response: "garantia" },
  { words: ["contato", "telefone", "número", "numero"], response: "contato" },
  { words: ["whatsapp"], response: "whatsapp" },
  { words: ["ajuda", "suporte", "emergência", "emergencia"], response: "ajuda" },
  { words: ["horário", "horario", "atendimento", "funcionamento"], response: "horario" },
  { words: ["data", "dia", "hoje"], response: "data" },
  // Adicione mais de 100 palavras-chave mapeadas aqui
  { words: ["cromoterapia", "cores", "energia"], response: "cromoterapia" },
  { words: ["massagem sueca", "aromaterapia"], response: "massagem" },
  { words: ["alongamento", "esmaltação", "decoração"], response: "unhas" },
  { words: ["cartão", "boleto", "pix"], response: "pagamento" },
  { words: ["promoção especial", "oferta"], response: "desconto" },
  { words: ["prazo de entrega"], response: "entrega" },
  { words: ["garantia produtos", "garantia serviços"], response: "garantia" },
  { words: ["falar com atendente", "contato humano"], response: "contato" }
];

// ================================
// Função para processar mensagem recebida
// ================================
function getResponse(msg) {
  msg = msg.toLowerCase();

  for (let key of keywords) {
    for (let word of key.words) {
      if (msg.includes(word)) {
        return responses[key.response];
      }
    }
  }
  return responses.default;
}

// ================================
// Endpoint Twilio → WhatsApp
// ================================
app.post("/whatsapp", (req, res) => {
  const incomingMsg = req.body.Body || "";
  const reply = getResponse(incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// ================================
// Inicia servidor
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot rodando na porta ${PORT}`));
