import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// OpenRouter config
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "deepseek/chat-v3-0324:free"; // exemplo de modelo grátis em 2025

// Respostas fixas (fallback se não usar IA)
const responses = {
  "produto": "Temos diversos produtos disponíveis. Quer ver nosso catálogo?",
  "catalogo": "Aqui está nosso catálogo: [link do catálogo]",
  "preço": "Os preços variam conforme o produto. Qual item você quer saber?",
  "pagamento": "Aceitamos PIX, cartão e boleto. Deseja prosseguir?",
  "default": "Desculpe, não entendi. Vou consultar a IA para te ajudar..."
};

// Função para respostas fixas
function getResponse(msg) {
  msg = msg.toLowerCase();
  if (msg.includes("produto")) return responses.produto;
  if (msg.includes("catalogo")) return responses.catalogo;
  if (msg.includes("preço") || msg.includes("valor")) return responses.preço;
  if (msg.includes("pagamento") || msg.includes("pix")) return responses.pagamento;
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

  // Se não achou, consulta IA
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
