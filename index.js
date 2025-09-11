import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// OpenRouter config
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "deepseek/deepseek-r1:free";

// Respostas fixas do bot
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

  // Pergunta sobre data
  if (msg.includes("que dia é hoje") || msg.includes("data de hoje")) {
    const hoje = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return `Hoje é ${hoje.toLocaleDateString('pt-BR', options)}. 😊`;
  }

  // Pergunta sobre hora
  if (msg.includes("que horas") || msg.includes("hora")) {
    const agora = new Date();
    return `Agora são ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. ⏰`;
  }

  // Respostas fixas
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
    const prompt = `
Você é um assistente virtual de atendimento da empresa XYZ.
Responda de forma amigável, clara e curta, usando emojis quando apropriado.
Sempre verifique se a pergunta não se encaixa em respostas fixas antes de inventar algo.
Se não souber a resposta, sugira falar com um atendente humano via WhatsApp.
Pergunta do usuário: "${userMessage}"
`;
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: "user", content: prompt }]
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

  // Se a mensagem do usuário for sobre produtos ou catálogo, envia botões interativos
  if (incomingMsg.toLowerCase().includes("produto") || incomingMsg.toLowerCase().includes("catálogo")) {
    const message = twiml.message();
    message.body(reply);

    message.interactive({
      type: "button",
      body: { text: "Escolha uma opção:" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "ver_catalogo", title: "📄 Ver Catálogo" } },
          { type: "reply", reply: { id: "falar_atendente", title: "💬 Falar com Humano" } }
        ]
      }
    });
  } else {
    twiml.message(reply);
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot rodando na porta ${PORT}`));
