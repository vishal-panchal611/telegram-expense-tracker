// userService.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Register a new user
export async function registerUser(chatId, username) {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", chatId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingUser) {
      return existingUser.id; // already registered
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ telegram_id: chatId, username }])
      .select("id")
      .single();

    if (error) throw error;

    return data.id;
  } catch (err) {
    console.error("registerUser error:", err.message);
    throw err;
  }
}

// Add an expense
export async function addExpense(chatId, amount, category) {
  try {
    // get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", chatId)
      .single();

    if (userError) throw userError;

    // insert expense
    const { error } = await supabase.from("expenses").insert([
      {
        user_id: user.id,
        amount,
        category,
        main_category: category, // we can refine later
      },
    ]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("addExpense error:", err.message);
    throw err;
  }
}

// Get today’s expenses
export async function getTodayExpenses(chatId) {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", chatId)
      .single();

    if (userError) throw userError;

    const { data, error } = await supabase
      .from("expenses")
      .select("amount, category, created_at")
      .eq("user_id", user.id)
      .gte("created_at", new Date().toISOString().slice(0, 10)) // today
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("getTodayExpenses error:", err.message);
    throw err;
  }
}

// Get monthly expenses
export async function getMonthlyExpenses(chatId) {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", chatId)
      .single();

    if (userError) throw userError;

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);

    const { data, error } = await supabase
      .from("expenses")
      .select("amount, category, created_at")
      .eq("user_id", user.id)
      .gte("created_at", firstDayOfMonth.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("getMonthlyExpenses error:", err.message);
    throw err;
  }
}
