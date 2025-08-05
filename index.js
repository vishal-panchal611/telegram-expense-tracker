// index.js used for testing entries in sheet via vscode
// const { addExpense } = require("./googleSheet");

// (async () => {
//   const category = "vadapav";
//   const amount = 100;
//   const result = await addExpense(amount, category);
//   console.log(`Added ₹${amount} under category ${result}`);
// })();

//index.js used for sending data from telegram to google sheets
// index.js
const TelegramBot = require("node-telegram-bot-api");
const { addExpense } = require("./googleSheet");
require("dotenv").config();

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 Hi ${msg.chat.first_name}! 
Send your expenses like:
\`100 vadapav\`
I'll log it and show you daily summaries soon!`,
    {
      parse_mode: "Markdown",
    }
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Ignore /start messages (already handled)
  if (text.startsWith("/start")) return;

  const parts = text.split(" ");
  if (parts.length !== 2) {
    return bot.sendMessage(
      chatId,
      "❌ Format: `amount category` e.g. `150 metro`",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const [amount, category] = parts;
  if (isNaN(amount)) {
    return bot.sendMessage(chatId, "❌ Amount should be a number", {
      parse_mode: "Markdown",
    });
  }

  try {
    const mainCategory = await addExpense(amount, category);
    bot.sendMessage(
      chatId,
      `✅ ₹${amount} added under *${mainCategory}* (${category})`,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (err) {
    console.error("❌ Error adding expense:", err.message);
    bot.sendMessage(chatId, "❌ Something went wrong. Please try again.");
  }
});
