// FOR ZIP.zip/FOR ZIP/index.js

import express from "express";
import bodyParser from "body-parser";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import cron from "node-cron";
import {
  registerUser,
  addExpense,
  getTodayExpenses,
  getMonthlyExpenses,
  isUserRegistered,
  getAllUsers,
  formatSummary,
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

app.use(bodyParser.json());

const baseUrl =
  process.env.WEBHOOK_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
const webhookUrl = `${baseUrl}/bot${token}`;

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name || msg.from.username || "Unknown";

  try {
    const userExists = await isUserRegistered(chatId);

    if (userExists) {
      return bot.sendMessage(
        chatId,
        `👋 Welcome back, ${username}! You're already registered. Feel free to start tracking your expenses.`
      );
    }

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

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (text.startsWith("/")) return;

  try {
    const isRegistered = await isUserRegistered(chatId);
    if (!isRegistered) {
      return bot.sendMessage(
        chatId,
        "To start registration and track your expenses, please send /start."
      );
    }
  } catch (err) {
    console.error("❌ Error checking user registration:", err);
    return bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
  }

  const parts = text.split(" ");
  if (parts.length < 2 || isNaN(parts[0])) {
    return bot.sendMessage(chatId, "❌ Invalid format. Use: `200 coffee`");
  }

  const amount = parseFloat(parts[0]);
  const item = parts.slice(1).join(" ").toLowerCase();

  try {
    await addExpense(chatId, amount, item);
    bot.sendMessage(chatId, `✅ Added expense: ₹${amount} for *${item}*`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("❌ Expense error:", err);
    bot.sendMessage(chatId, "❌ Something went wrong. Please try again.");
  }
});

// ✅ Updated to use the new formatSummary
bot.onText(/\/daily/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const expenses = await getTodayExpenses(chatId);
    const summaryText = formatSummary(expenses, "Today's");
    bot.sendMessage(chatId, summaryText, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error fetching daily expenses:", err);
    bot.sendMessage(chatId, "❌ Could not fetch daily expenses.");
  }
});

// ✅ Updated to use the new formatSummary with the isMonthly flag
bot.onText(/\/monthly/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const expenses = await getMonthlyExpenses(chatId);
    const summaryText = formatSummary(expenses, "This Month's", true);
    bot.sendMessage(chatId, summaryText, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error fetching monthly expenses:", err);
    bot.sendMessage(chatId, "❌ Could not fetch monthly expenses.");
  }
});

const runDailySummary = async () => {
  console.log("Running daily summary cron job...");
  try {
    const users = await getAllUsers();
    for (const chatId of users) {
      const expenses = await getTodayExpenses(chatId);
      const summary = formatSummary(expenses, "Today's");
      await bot.sendMessage(chatId, summary, { parse_mode: "Markdown" });
    }
    console.log("Daily summary job finished.");
  } catch (err) {
    console.error("❌ Daily summary cron job failed:", err);
  }
};

const runMonthlySummary = async () => {
  console.log("Running monthly summary cron job...");
  try {
    const users = await getAllUsers();
    for (const chatId of users) {
      const expenses = await getMonthlyExpenses(chatId);
      const summary = formatSummary(expenses, "This Month's", true);
      await bot.sendMessage(chatId, summary, { parse_mode: "Markdown" });
    }
    console.log("Monthly summary job finished.");
  } catch (err) {
    console.error("❌ Monthly summary cron job failed:", err);
  }
};

app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);
  try {
    await bot.setWebHook(webhookUrl);
    console.log(`🌍 Webhook set at: ${webhookUrl}`);

    cron.schedule("59 23 * * *", runDailySummary, {
      timezone: "Asia/Kolkata",
    });

    cron.schedule("59 23 L * *", runMonthlySummary, {
      timezone: "Asia/Kolkata",
    });

    console.log("🗓️ Cron jobs scheduled successfully.");
  } catch (err) {
    console.error("❌ Failed to set webhook or schedule jobs:", err);
  }
});
