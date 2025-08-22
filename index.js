require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const {
  addExpense,
  getTodayExpenses,
  getMonthlyExpenses,
} = require("./expenseService");
const { registerUser } = require("./userService");
const express = require("express");
const app = express();

// Telegram Bot setup
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.chat.username || msg.chat.first_name;

  try {
    await registerUser(chatId, username);
    bot.sendMessage(
      chatId,
      `👋 Hi ${username}!\n\n✅ You are registered.\n\nSend expenses like:\n200 coffee`
    );
  } catch (error) {
    console.error("❌ Registration failed:", error.message);
    bot.sendMessage(chatId, "❌ Registration failed. Try again later.");
  }
});

// Handle expense messages (e.g., "200 coffee")
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!isNaN(text.split(" ")[0]) && text.split(" ").length > 1) {
    const amount = text.split(" ")[0];
    const category = text.split(" ").slice(1).join(" ");
    const username = msg.chat.username || msg.chat.first_name;

    try {
      await addExpense(chatId, username, amount, category);
      bot.sendMessage(chatId, `✅ Expense added: ${amount} for ${category}`);
    } catch (error) {
      console.error("❌ Failed to add expense:", error.message);
      bot.sendMessage(chatId, "❌ Something went wrong. Please try again.");
    }
  }
});

// /myexpenses → today’s expenses
bot.onText(/\/myexpenses/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const expenses = await getTodayExpenses(chatId);
    if (expenses.length === 0) {
      bot.sendMessage(chatId, "📭 No expenses recorded today.");
      return;
    }

    let response = "📅 *Today's Expenses:*\n\n";
    let total = 0;

    expenses.forEach((exp) => {
      response += `💰 ${exp.amount} - ${exp.category} (${exp.main_category})\n`;
      total += parseFloat(exp.amount);
    });

    response += `\n*Total*: ${total}`;
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("❌ Error fetching expenses:", error.message);
    bot.sendMessage(chatId, "❌ Could not fetch expenses.");
  }
});

// /monthly → this month's expenses
bot.onText(/\/monthly/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const expenses = await getMonthlyExpenses(chatId);
    if (expenses.length === 0) {
      bot.sendMessage(chatId, "📭 No expenses recorded this month.");
      return;
    }

    let response = "📅 *This Month's Expenses:*\n\n";
    let total = 0;

    expenses.forEach((exp) => {
      response += `💰 ${exp.amount} - ${exp.category} (${exp.main_category})\n`;
      total += parseFloat(exp.amount);
    });

    response += `\n*Total*: ${total}`;
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("❌ Error fetching monthly expenses:", error.message);
    bot.sendMessage(chatId, "❌ Could not fetch monthly expenses.");
  }
});

app.get("/", (req, res) => {
  res.send("Bot is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
