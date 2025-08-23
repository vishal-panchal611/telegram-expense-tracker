import express from "express";
import bodyParser from "body-parser";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import {
  registerUser,
  addExpense,
  getTodayExpenses,
  getMonthlyExpenses,
} from "./userService.js";

dotenv.config();
console.log("ENV WEBHOOK_URL:", process.env.WEBHOOK_URL);
console.log(
  "ENV RENDER_EXTERNAL_HOSTNAME:",
  process.env.RENDER_EXTERNAL_HOSTNAME
);

const app = express();
const port = process.env.PORT || 3000;

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN is missing in environment variables!");
  process.exit(1);
}

const bot = new TelegramBot(token);

// Middleware
app.use(bodyParser.json());

// ✅ Webhook URL
const baseUrl =
  process.env.WEBHOOK_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
const webhookUrl = `${baseUrl}/bot${token}`;

// ✅ Endpoint to receive updates from Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🟢 /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || "Unknown";

  try {
    await registerUser(chatId, username);
    bot.sendMessage(
      chatId,
      `👋 Hi ${username}!\n\n✅ You are registered.\n\nSend expenses like:\n200 coffee`
    );
  } catch (err) {
    console.error("❌ Registration error:", err);
    bot.sendMessage(chatId, "❌ Registration failed. Please try again.");
  }
});

// 🟢 Handle expenses
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text.startsWith("/")) return; // Ignore commands here

  const parts = msg.text.trim().split(" ");
  if (parts.length < 2 || isNaN(parts[0])) {
    return bot.sendMessage(chatId, "❌ Invalid format. Use: `200 coffee`");
  }

  const amount = parseFloat(parts[0]);
  const category = parts.slice(1).join(" ");

  try {
    await addExpense(chatId, amount, category);
    bot.sendMessage(chatId, `✅ Added expense: ₹${amount} for *${category}*`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("❌ Expense error:", err);
    bot.sendMessage(chatId, "❌ Something went wrong. Please try again.");
  }
});

// 🟢 /myexpenses (today)
bot.onText(/\/myexpenses/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const expenses = await getTodayExpenses(chatId);
    if (expenses.length === 0) {
      return bot.sendMessage(chatId, "📭 No expenses found for today.");
    }

    let text = "📝 *Today's Expenses:*\n\n";
    let total = 0;
    expenses.forEach((e) => {
      text += `- ₹${e.amount} on ${e.category}\n`;
      total += parseFloat(e.amount);
    });
    text += `\n💰 *Total:* ₹${total}`;
    bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error fetching today's expenses:", err);
    bot.sendMessage(chatId, "❌ Could not fetch today's expenses.");
  }
});

// 🟢 /monthly (current month)
bot.onText(/\/monthly/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const expenses = await getMonthlyExpenses(chatId);
    if (expenses.length === 0) {
      return bot.sendMessage(chatId, "📭 No expenses found this month.");
    }

    let text = "📅 *This Month's Expenses:*\n\n";
    let total = 0;
    expenses.forEach((e) => {
      text += `- ₹${e.amount} on ${e.category} (${new Date(
        e.created_at
      ).toLocaleDateString()})\n`;
      total += parseFloat(e.amount);
    });
    text += `\n💰 *Total:* ₹${total}`;
    bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error fetching monthly expenses:", err);
    bot.sendMessage(chatId, "❌ Could not fetch monthly expenses.");
  }
});

// ✅ Start server and then set webhook
app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);
  try {
    await bot.setWebHook(webhookUrl);
    console.log(`🌍 Webhook set at: ${webhookUrl}`);
  } catch (err) {
    console.error("❌ Failed to set webhook:", err);
  }
});
