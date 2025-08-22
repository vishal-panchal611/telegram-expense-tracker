const { supabase } = require("./supabaseClient");
const { registerUser } = require("./userService");

const categoryMap = {
  vadapav: "Food",
  samosa: "Food",
  coffee: "Food",
  burger: "Food",
  metro: "Travel",
  rickshaw: "Travel",
  cab: "Travel",
  movie: "Entertainment",
  recharge: "Utilities",
  rent: "Housing",
};

function classifyCategory(input) {
  const lower = input.toLowerCase();
  return categoryMap[lower] || "Miscellaneous";
}

async function addExpense(telegramId, username, amount, category) {
  await registerUser(telegramId, username);

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (userError || !user) throw new Error("User not found");

  const { error: insertError } = await supabase.from("expenses").insert([
    {
      user_id: user.id,
      amount,
      category,
    },
  ]);

  if (insertError) throw insertError;
  return true;
}

// Get all today's expenses
async function getTodayExpenses(telegramId) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (userError || !user) throw new Error("User not found");

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category, created_at")
    .eq("user_id", user.id)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
// Get this month's expenses
async function getMonthlyExpenses(telegramId) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (userError || !user) throw new Error("User not found");

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category, created_at")
    .eq("user_id", user.id)
    .gte("created_at", `${firstDay}T00:00:00`)
    .lte("created_at", `${lastDay}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = { addExpense, getTodayExpenses, getMonthlyExpenses };
