const supabase = require("./supabaseClient");
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

// Add expense for a user
async function addExpense(telegramId, username, amount, categoryInput) {
  // Ensure user exists
  await registerUser(telegramId, username);

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (userError || !user) throw new Error("User not found");

  const finalCategory = classifyCategory(categoryInput);

  const { error: insertError } = await supabase.from("expenses").insert([
    {
      user_id: user.id,
      amount: parseFloat(amount),
      category: categoryInput,
      main_category: finalCategory,
    },
  ]);

  if (insertError) throw insertError;
  return true;
}

// Fetch today's expenses for a user
async function getTodayExpenses(telegramId) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (userError || !user) throw new Error("User not found");

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category, main_category, created_at")
    .eq("user_id", user.id)
    .gte("created_at", `${today} 00:00:00`)
    .lte("created_at", `${today} 23:59:59`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Fetch monthly expenses for a user
async function getMonthlyExpenses(telegramId) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (userError || !user) throw new Error("User not found");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category, main_category, created_at")
    .eq("user_id", user.id)
    .gte("created_at", `${startOfMonth} 00:00:00`)
    .lte("created_at", `${now.toISOString().split("T")[0]} 23:59:59`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = {
  addExpense,
  getTodayExpenses,
  getMonthlyExpenses,
};
