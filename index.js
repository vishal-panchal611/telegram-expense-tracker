const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const express = require("express");

const { registerUser } = require("./userService");
const {
  addExpense: addExpenseSupabase,
  getRecentExpenses,
} = require("./expenseService");
const { addExpense: addExpenseSheet } = require("./googleSheet"); // keep sheet backup for now

const app = express();
const PORT = process.env.PORT || 3000;

// Create bot without polling (for webhook mode)
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);

app.use(express.json());

// Set webhook
const url = process.env.RENDER_EXTERNAL_URL;
bot.setWebHook(`${url}/bot${process.env.TELEGRAM_TOKEN}`);

// Telegram webhook endpoint
app.post(`/bot${process.env.TELEGRAM_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check
app.get("/", (req, res) => {
  res.send("Telegram Expense Tracker Bot is running 🚀");
});

// ──────────────────────────────
// Commands
// ──────────────────────────────
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.chat.username || "Unknown";

  try {
    await registerUser(chatId, username);
    bot.sendMessage(
      chatId,
      `👋 Hi ${msg.chat.first_name}!\n\n✅ You are registered.\n\nSend expenses like:\n\`200 coffee\``,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    bot.sendMessage(chatId, "❌ Registration failed: " + err.message);
  }
});

// Show recent expenses
bot.onText(/\/myexpenses/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const expenses = await getTodayExpenses(chatId);
    if (expenses.length === 0) {
      return bot.sendMessage(chatId, "📭 No expenses found for today.");
    }

    let total = 0;
    let response = "📊 *Your Expenses Today:*\n\n";
    expenses.forEach((e) => {
      total += parseFloat(e.amount);
      response += `- ₹${e.amount} | ${
        e.category || "uncategorized"
      } | ${new Date(e.created_at).toLocaleTimeString()}\n`;
    });

    response += `\n💰 *Total spent today:* ₹${total.toFixed(2)}`;

    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error fetching expenses:", err.message);
    bot.sendMessage(
      chatId,
      "❌ Could not fetch today's expenses, try again later."
    );
  }
});

// Show monthly expenses
bot.onText(/\/monthly/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const expenses = await getMonthlyExpenses(chatId);
    if (expenses.length === 0) {
      return bot.sendMessage(chatId, "📭 No expenses found this month.");
    }

    let total = 0;
    const categoryTotals = {};

    expenses.forEach((e) => {
      total += parseFloat(e.amount);
      const cat = e.category || "uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(e.amount);
    });

    let response = "📅 *Your Monthly Expenses (by category):*\n\n";
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      response += `- ${cat}: ₹${amt.toFixed(2)}\n`;
    }

    response += `\n💰 *Total this month:* ₹${total.toFixed(2)}`;
    bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error fetching monthly expenses:", err.message);
    bot.sendMessage(
      chatId,
      "❌ Could not fetch monthly expenses, try again later."
    );
  }
});

// ──────────────────────────────
// Handle new expense messages
// ──────────────────────────────
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (text.startsWith("/")) return; // skip commands

  const parts = text.split(" ");
  if (parts.length < 2) {
    return bot.sendMessage(
      chatId,
      "❌ Format: `amount category` e.g. `150 metro`",
      { parse_mode: "Markdown" }
    );
  }

  const [amount, ...rest] = parts;
  const category = rest.join(" ");

  if (isNaN(amount)) {
    return bot.sendMessage(chatId, "❌ Amount should be a number", {
      parse_mode: "Markdown",
    });
  }

  try {
    // Dual write: Google Sheet + Supabase
    await addExpenseSheet(amount, category);
    await addExpenseSupabase(
      chatId,
      msg.chat.username || "Unknown",
      amount,
      category
    );

    bot.sendMessage(chatId, `✅ ₹${amount} added under *${category}*`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("❌ Error adding expense:", err.message);
    bot.sendMessage(chatId, "❌ Something went wrong. Please try again.");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
