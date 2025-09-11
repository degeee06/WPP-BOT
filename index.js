import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const responses = {
    "menu": `Olá! Sou o assistente virtual da empresa. Selecione uma opção digitando o número:
1️⃣ Produtos/Catálogo
2️⃣ Preços e Valores
3️⃣ Descontos e Promoções
4️⃣ Formas de Pagamento
5️⃣ Prazos de Entrega
6️⃣ Garantia dos Produtos
7️⃣ Contato/WhatsApp
8️⃣ Horário de Atendimento`,
    "1": "Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?",
    "2": "Os preços variam conforme o produto. Qual item você está interessado?",
    "3": "Temos promoções especiais esta semana! Me diga qual produto te interessa.",
    "4": "Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto.",
    "5": "O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento.",
    "6": "Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação.",
    "7": "Você pode falar diretamente conosco pelo WhatsApp: (11) 99999-9999",
    "8": "Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
    "default": "Desculpe, não entendi. Digite 'menu' para ver as opções novamente."
};

// Endpoint para WhatsApp
app.post("/whatsapp", async (req, res) => {
    const incomingMsg = (req.body.Body || "").trim().toLowerCase();
    const from = req.body.From;

    let reply = responses["default"];

    // Exibir menu se digitar "menu"
    if (incomingMsg === "menu") reply = responses["menu"];
    else if (["1","2","3","4","5","6","7","8"].includes(incomingMsg)) reply = responses[incomingMsg];

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);

    res.set("Content-Type", "text/xml");
    res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
