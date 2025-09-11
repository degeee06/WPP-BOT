import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Respostas iguais ao HTML
const responses = {
  "produto": "📦 Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?",
  "preço": "💲 Os preços variam conforme o produto. Qual item você está interessado?",
  "desconto": "🎉 Temos promoções especiais esta semana! Me diga qual produto te interessa.",
  "pagamento": "💳 Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto.",
  "entrega": "🚚 O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento.",
  "garantia": "🛡️ Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação.",
  "contato": "☎️ Você pode falar diretamente conosco pelo WhatsApp: (11) 99999-9999",
  "horario": "⏰ Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
  "default": "❓ Desculpe, não entendi. Digite *menu* para ver as opções."
};

// Rota principal do WhatsApp
app.post("/whatsapp", (req, res) => {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  const incoming = (req.body.Body || "").toLowerCase().trim();

  // Se o usuário digitar "menu" ou for a primeira mensagem → mostra lista interativa
  if (incoming === "" || incoming === "menu" || incoming === "hi" || incoming === "oi") {
    const msg = twiml.message("👋 Olá! Sou o assistente virtual.\nSelecione uma opção abaixo:");

    msg.addInteractiveMessage({
      type: "list",
      header: { type: "text", text: "Central de Atendimento" },
      body: { text: "Escolha uma das opções:" },
      action: {
        button: "Ver opções",
        sections: [
          {
            title: "Serviços",
            rows: [
              { id: "produto", title: "📦 Produtos/Catálogo" },
              { id: "preço", title: "💲 Preços e Valores" },
              { id: "desconto", title: "🎉 Descontos e Promoções" },
              { id: "pagamento", title: "💳 Formas de Pagamento" },
              { id: "entrega", title: "🚚 Prazos de Entrega" },
              { id: "garantia", title: "🛡️ Garantia dos Produtos" },
              { id: "contato", title: "☎️ Contato/WhatsApp" },
              { id: "horario", title: "⏰ Horário de Atendimento" }
            ]
          }
        ]
      }
    });

    return res.type("text/xml").send(twiml.toString());
  }

  // Caso clique em uma opção da lista
  const reply = responses[incoming] || responses.default;
  twiml.message(reply + "\n\nDigite *menu* para voltar às opções.");
  res.type("text/xml").send(twiml.toString());
});

// Teste no navegador
app.get("/", (req, res) => {
  res.send("Bot WhatsApp com Lista Interativa ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
