import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Respostas automáticas (mesmo do HTML)
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

// Endpoint que o Twilio chama quando recebe mensagem
app.post("/whatsapp", async (req, res) => {
    const incomingMsg = req.body.Body?.toLowerCase() || "";
    const from = req.body.From;

    let reply = responses["default"];

    if (incomingMsg.includes("produto") || incomingMsg.includes("catálogo")) reply = responses["produto"];
    else if (incomingMsg.includes("preço") || incomingMsg.includes("valor")) reply = responses["preço"];
    else if (incomingMsg.includes("desconto") || incomingMsg.includes("promoção")) reply = responses["desconto"];
    else if (incomingMsg.includes("pagamento")) reply = responses["pagamento"];
    else if (incomingMsg.includes("entrega")) reply = responses["entrega"];
    else if (incomingMsg.includes("garantia")) reply = responses["garantia"];
    else if (incomingMsg.includes("contato") || incomingMsg.includes("whatsapp")) reply = responses["contato"];
    else if (incomingMsg.includes("horário") || incomingMsg.includes("atendimento")) reply = responses["horario"];

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);

    res.set("Content-Type", "text/xml");
    res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
