import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// -----------------------------
// Respostas e menus do bot
// -----------------------------
const responses = {
  "menu_principal": `Olá! Escolha uma opção:
1️⃣ Produtos
2️⃣ Serviços
3️⃣ Promoções
4️⃣ Pagamento
5️⃣ Contato/Atendimento humano`,
  "produtos": `Temos diversos produtos disponíveis. Posso te mostrar nosso catálogo? [link do catálogo]`,
  "servicos": `Nossos serviços disponíveis:
- Cromoterapia
- Massagem Relaxante
- Design de Unhas
Digite o serviço que deseja saber mais ou 'menu' para voltar.`,
  "promocoes": `Temos promoções especiais esta semana! Produtos com até 30% OFF, serviços com 10% de desconto.`,
  "pagamento": `Aceitamos PIX, cartão e boleto. Quer gerar pagamento via PIX?`,
  "contato": `Você pode falar diretamente com nosso atendente pelo WhatsApp: https://wa.me/5511999999999`,
  "default": `Desculpe, não entendi. Digite 'menu' para ver as opções disponíveis.`
};

// -----------------------------
// Armazena o estado de cada usuário
// -----------------------------
const userState = {}; // chave = número do WhatsApp

// -----------------------------
// Função para processar a mensagem
// -----------------------------
function getResponse(from, msg) {
  msg = msg.toLowerCase().trim();

  // Se usuário pedir menu ou reset
  if (msg === "menu") {
    userState[from] = "menu_principal";
    return responses.menu_principal;
  }

  // Checa estado atual do usuário
  const state = userState[from] || "menu_principal";

  switch (state) {
    case "menu_principal":
      if (msg === "1" || msg.includes("produto")) {
        userState[from] = "produtos";
        return responses.produtos;
      } else if (msg === "2" || msg.includes("serviço") || msg.includes("servico")) {
        userState[from] = "servicos";
        return responses.servicos;
      } else if (msg === "3" || msg.includes("promoção") || msg.includes("promocao")) {
        userState[from] = "promocoes";
        return responses.promocoes;
      } else if (msg === "4" || msg.includes("pagamento")) {
        userState[from] = "pagamento";
        return responses.pagamento;
      } else if (msg === "5" || msg.includes("contato") || msg.includes("atendimento")) {
        userState[from] = "contato";
        return responses.contato;
      } else {
        return responses.default;
      }

    case "produtos":
    case "servicos":
    case "promocoes":
    case "pagamento":
    case "contato":
      // Sempre permite voltar ao menu principal
      if (msg === "menu") {
        userState[from] = "menu_principal";
        return responses.menu_principal;
      } else {
        // Para qualquer outra mensagem, mantém o estado atual
        return `Para voltar ao menu, digite 'menu'.`;
      }

    default:
      userState[from] = "menu_principal";
      return responses.menu_principal;
  }
}

// -----------------------------
// Endpoint do Twilio para WhatsApp
// -----------------------------
app.post("/whatsapp", (req, res) => {
  const incomingMsg = req.body.Body || "";
  const from = req.body.From || "";

  const reply = getResponse(from, incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// -----------------------------
// Iniciar servidor
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot rodando na porta ${PORT}`));
