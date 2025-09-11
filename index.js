import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const menuOptions = [
  { id: "produto", title: "Produtos/Catálogo" },
  { id: "preco", title: "Preços e Valores" },
  { id: "desconto", title: "Descontos e Promoções" },
  { id: "pagamento", title: "Formas de Pagamento" },
  { id: "entrega", title: "Prazos de Entrega" },
  { id: "garantia", title: "Garantia dos Produtos" },
  { id: "contato", title: "Contato/WhatsApp" },
  { id: "horario", title: "Horário de Atendimento" }
];

const responses = {
  "produto": "Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?",
  "preco": "Os preços variam conforme o produto. Qual item você está interessado?",
  "desconto": "Temos promoções especiais esta semana! Me diga qual produto te interessa.",
  "pagamento": "Aceitamos PIX, cartão e boleto.",
  "entrega": "O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento.",
  "garantia": "Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação.",
  "contato": "Você pode falar conosco pelo WhatsApp: (11) 99999-9999",
  "horario": "Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas."
};

// Endpoint para WhatsApp
app.post("/whatsapp", async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body || "";
  
  // Se a mensagem é inicial ou qualquer texto, envia menu interativo
  if (!responses[body.toLowerCase()]) {
    try {
      const buttons = menuOptions.slice(0, 3).map(opt => ({ type: "reply", reply: { id: opt.id, title: opt.title } }));
      const message = {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        contentType: "application/json",
        interactive: {
          type: "button",
          body: { text: "Olá! Sou o assistente virtual. Selecione uma opção:" },
          action: { buttons }
        }
      };

      // Envia via Twilio (mensagem interativa)
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        content: JSON.stringify(message)
      });
    } catch (err) {
      console.error(err);
    }
    return res.sendStatus(200);
  }

  // Resposta padrão quando o usuário clica
  const replyText = responses[body.toLowerCase()];
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(replyText);

  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
