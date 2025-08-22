const supabase = require("./supabaseClient");

async function registerUser(userId, username) {
  try {
    if (!supabase) {
      console.error(
        "❌ Supabase client is undefined. Check supabaseClient.js export."
      );
      throw new Error("Supabase client not initialized");
    }

    console.log("🔍 Registering user:", { userId, username });

    const { data, error } = await supabase
      .from("users")
      .insert([{ telegram_id: userId, username }]);

    if (error) {
      console.error("❌ Supabase insert error:", error);
      throw error;
    }

    console.log("✅ User registered:", data);
    return data;
  } catch (err) {
    console.error("❌ registerUser failed:", err.message);
    throw err;
  }
}

async function getUserExpenses(userId, date) {
  try {
    if (!supabase) {
      console.error("❌ Supabase client is undefined.");
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("telegram_id", userId)
      .gte("date", date + " 00:00:00")
      .lte("date", date + " 23:59:59");

    if (error) {
      console.error("❌ Supabase select error:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("❌ getUserExpenses failed:", err.message);
    throw err;
  }
}

async function getMonthlyExpenses(userId, monthStart, monthEnd) {
  try {
    if (!supabase) {
      console.error("❌ Supabase client is undefined.");
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("telegram_id", userId)
      .gte("date", monthStart)
      .lte("date", monthEnd);

    if (error) {
      console.error("❌ Supabase monthly select error:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("❌ getMonthlyExpenses failed:", err.message);
    throw err;
  }
}

module.exports = { registerUser, getUserExpenses, getMonthlyExpenses };
