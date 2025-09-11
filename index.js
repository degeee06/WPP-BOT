import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Respostas para cada opção
const responses = {
  "produto": "Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?",
  "preço": "Os preços variam conforme o produto. Qual item você está interessado?",
  "desconto": "Temos promoções especiais esta semana! Me diga qual produto te interessa.",
  "pagamento": "Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto.",
  "entrega": "O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento.",
  "garantia": "Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação.",
  "contato": "Você pode falar diretamente conosco pelo WhatsApp: (11) 99999-9999",
  "horario": "Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
  "default": "Desculpe, não entendi. Poderia reformular sua pergunta?"
};

// Rota inicial — envia o menu com botões
app.post("/whatsapp", (req, res) => {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  const incoming = (req.body.Body || "").toLowerCase().trim();

  // Se ainda não escolheu nada → mostra os botões
  if (incoming === "" || incoming === "menu") {
    const msg = twiml.message("👋 Olá! Sou o assistente virtual da empresa.\nComo posso te ajudar?");
    msg.addInteractiveMessage({
      type: "button",
      body: {
        text: "Selecione uma opção abaixo:"
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "produto", title: "📦 Produtos/Catálogo" } },
          { type: "reply", reply: { id: "preço", title: "💲 Preços e Valores" } },
          { type: "reply", reply: { id: "desconto", title: "🎉 Descontos" } },
          { type: "reply", reply: { id: "pagamento", title: "💳 Pagamento" } },
          { type: "reply", reply: { id: "entrega", title: "🚚 Entrega" } },
          { type: "reply", reply: { id: "garantia", title: "🛡️ Garantia" } },
          { type: "reply", reply: { id: "contato", title: "☎️ Contato" } },
          { type: "reply", reply: { id: "horario", title: "⏰ Horário" } }
        ]
      }
    });
    return res.type("text/xml").send(twiml.toString());
  }

  // Se clicou em um botão → responder com o conteúdo
  const reply = responses[incoming] || responses.default;
  twiml.message(reply + "\n\nDigite 'menu' para voltar às opções.");
  res.type("text/xml").send(twiml.toString());
});

app.get("/", (req, res) => {
  res.send("Bot WhatsApp com botões ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
