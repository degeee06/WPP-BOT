import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// OpenRouter config
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "deepseek/deepseek-r1:free"; // modelo grátis 2025

// Respostas fixas (copiadas do seu HTML)
const responses = {
  "produto": "Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo?",
  "catalogo": "Aqui está nosso catálogo: [link do catálogo]. Posso te ajudar com mais alguma coisa?",
  "preço": "Os preços variam conforme o produto. Qual item você está interessado?",
  "desconto": "Temos promoções especiais esta semana! Me diga qual produto te interessa.",
  "pagamento": "Aceitamos várias formas de pagamento, incluindo PIX, cartão e boleto. Gostaria de prosseguir com o pagamento?",
  "pix": "Vou preparar o pagamento via PIX para você...",
  "entrega": "O prazo de entrega é de 3 a 5 dias úteis após a confirmação do pagamento.",
  "garantia": "Todos nossos produtos possuem garantia de 12 meses contra defeitos de fabricação.",
  "contato": "Você pode falar diretamente conosco pelo WhatsApp: (11) 99999-9999",
  "whatsapp": "Nosso WhatsApp é (11) 99999-9999.",
  "ajuda": "Precisa de ajuda imediata? Nosso time está disponível agora no WhatsApp.",
  "horario": "Nosso horário de atendimento é de segunda a sábado, das 08:00 às 19:00 horas.",
  "default": "Desculpe, não entendi. Vou consultar a IA para te ajudar..."
};

// Função para processar mensagem recebida e retornar resposta fixa
function getResponse(msg) {
  msg = msg.toLowerCase();

  if (msg.includes("produto") || msg.includes("catálogo")) return responses.produto;
  if (msg.includes("catalogo")) return responses.catalogo;
  if (msg.includes("preço") || msg.includes("valor")) return responses.preço;
  if (msg.includes("desconto") || msg.includes("promoção")) return responses.desconto;
  if (msg.includes("pagamento") || msg.includes("pagar") || msg.includes("pix")) return responses.pix;
  if (msg.includes("entrega") || msg.includes("prazo")) return responses.entrega;
  if (msg.includes("garantia")) return responses.garantia;
  if (msg.includes("contato") || msg.includes("whatsapp") || msg.includes("telefone") || msg.includes("número") || msg.includes("numero")) return responses.whatsapp;
  if (msg.includes("ajuda") || msg.includes("suporte") || msg.includes("emergência") || msg.includes("emergencia")) return responses.ajuda;
  if (msg.includes("horário") || msg.includes("horario") || msg.includes("atendimento") || msg.includes("funcionamento")) return responses.horario;

  return null; // se não achou, cai na IA
}

// Função para consultar IA via OpenRouter
async function queryLLM(userMessage) {
  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Erro LLM:", data);
      return "⚠️ Houve um erro ao consultar a IA.";
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error("Falha ao chamar IA:", err);
    return "⚠️ Não consegui acessar a IA agora.";
  }
}

// Endpoint Twilio → WhatsApp
app.post("/whatsapp", async (req, res) => {
  const incomingMsg = req.body.Body || "";
  
  // Primeiro tenta resposta fixa
  let reply = getResponse(incomingMsg);

  // Se não achou resposta fixa, consulta IA
  if (!reply) {
    reply = await queryLLM(incomingMsg);
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot rodando na porta ${PORT}`));
