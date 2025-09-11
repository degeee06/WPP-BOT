import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Configurações do Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Estrutura do menu
const mainMenu = `
Olá! Bem-vindo(a) ao atendimento. Escolha uma opção digitando o número correspondente:
1️⃣ Produtos
2️⃣ Serviços
3️⃣ Pagamento
4️⃣ Falar com atendente
`;

const servicesMenu = `
Nossos serviços disponíveis:
1️⃣ Massagem Relaxante
2️⃣ Cromoterapia
3️⃣ Design de Unhas
0️⃣ Voltar ao menu principal
`;

const productsMenu = `
Temos vários produtos disponíveis. Quer ver nossos catálogos?
1️⃣ Catálogo de Produtos
2️⃣ Catálogo de Serviços
0️⃣ Voltar ao menu principal
`;

const paymentMenu = `
Aceitamos várias formas de pagamento:
1️⃣ PIX
2️⃣ Cartão de Crédito
3️⃣ Boleto
0️⃣ Voltar ao menu principal
`;

// Função que processa mensagens
function processMessage(msg) {
  msg = msg.trim();

  // Menu inicial
  if (msg === "menu" || msg === "0") return mainMenu;

  // Menu principal
  if (msg === "1") return productsMenu;
  if (msg === "2") return servicesMenu;
  if (msg === "3") return paymentMenu;
  if (msg === "4") return `Você será direcionado para um atendente humano: https://wa.me/5511999999999`;

  // Submenu serviços
  if (msg === "1" && lastMenu === "services") return `Massagem Relaxante: Sessões de 50 ou 80 minutos com técnicas suecas e aromaterapia.`;
  if (msg === "2" && lastMenu === "services") return `Cromoterapia: Equilíbrio energético através das cores. Sessões de 30 a 60 minutos.`;
  if (msg === "3" && lastMenu === "services") return `Design de Unhas: Alongamento, manicure, pedicure e decoração artística.`;

  // Submenu produtos
  if (msg === "1" && lastMenu === "products") return `Catálogo de Produtos: [link do catálogo]`;
  if (msg === "2" && lastMenu === "products") return `Catálogo de Serviços: [link do catálogo]`;

  // Submenu pagamento
  if (msg === "1" && lastMenu === "payment") return `PIX selecionado. Você receberá instruções para pagamento.`;
  if (msg === "2" && lastMenu === "payment") return `Cartão de Crédito selecionado. Pagamento seguro via link.`;
  if (msg === "3" && lastMenu === "payment") return `Boleto selecionado. Você receberá o boleto para pagamento.`;

  return `Desculpe, não entendi. Digite "menu" para voltar ao início.`;
}

// Armazena em memória simples o último menu do usuário
const userState = {};
let lastMenu = null;

// Endpoint Twilio → WhatsApp
app.post("/whatsapp", async (req, res) => {
  const from = req.body.From;
  const incomingMsg = req.body.Body || "";

  // Determina menu atual
  if (!userState[from]) userState[from] = "main";
  lastMenu = userState[from];

  // Define próximo menu
  if (incomingMsg === "1" && lastMenu === "2") userState[from] = "products";
  else if (incomingMsg === "2" && lastMenu === "2") userState[from] = "services";
  else if (incomingMsg === "3" && lastMenu === "2") userState[from] = "payment";
  else if (incomingMsg === "0") userState[from] = "main";
  else userState[from] = lastMenu;

  const reply = processMessage(incomingMsg);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Bot rodando na porta ${PORT}`));
