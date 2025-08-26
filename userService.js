// // userService.js
// import { createClient } from "@supabase/supabase-js";
// import dotenv from "dotenv";

// dotenv.config();

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_KEY
// );

// // Register a new user
// export async function registerUser(chatId, username) {
//   try {
//     const { data: existingUser, error: fetchError } = await supabase
//       .from("users")
//       .select("id")
//       .eq("telegram_id", chatId)
//       .maybeSingle();

//     if (fetchError) throw fetchError;

//     if (existingUser) {
//       return existingUser.id; // already registered
//     }

//     const { data, error } = await supabase
//       .from("users")
//       .insert([{ telegram_id: chatId, username }])
//       .select("id")
//       .single();

//     if (error) throw error;

//     return data.id;
//   } catch (err) {
//     console.error("registerUser error:", err.message);
//     throw err;
//   }
// }

// // Add an expense
// export async function addExpense(chatId, amount, category) {
//   try {
//     // get user
//     const { data: user, error: userError } = await supabase
//       .from("users")
//       .select("id")
//       .eq("telegram_id", chatId)
//       .single();

//     if (userError) throw userError;

//     // insert expense
//     const { error } = await supabase.from("expenses").insert([
//       {
//         user_id: user.id,
//         amount,
//         category,
//         main_category: category, // we can refine later
//       },
//     ]);

//     if (error) throw error;
//     return true;
//   } catch (err) {
//     console.error("addExpense error:", err.message);
//     throw err;
//   }
// }

// // Get today’s expenses
// export async function getTodayExpenses(chatId) {
//   try {
//     const { data: user, error: userError } = await supabase
//       .from("users")
//       .select("id")
//       .eq("telegram_id", chatId)
//       .single();

//     if (userError) throw userError;

//     const { data, error } = await supabase
//       .from("expenses")
//       .select("amount, category, created_at")
//       .eq("user_id", user.id)
//       .gte("created_at", new Date().toISOString().slice(0, 10)) // today
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     return data;
//   } catch (err) {
//     console.error("getTodayExpenses error:", err.message);
//     throw err;
//   }
// }

// // Get monthly expenses
// export async function getMonthlyExpenses(chatId) {
//   try {
//     const { data: user, error: userError } = await supabase
//       .from("users")
//       .select("id")
//       .eq("telegram_id", chatId)
//       .single();

//     if (userError) throw userError;

//     const firstDayOfMonth = new Date();
//     firstDayOfMonth.setDate(1);

//     const { data, error } = await supabase
//       .from("expenses")
//       .select("amount, category, created_at")
//       .eq("user_id", user.id)
//       .gte("created_at", firstDayOfMonth.toISOString())
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     return data;
//   } catch (err) {
//     console.error("getMonthlyExpenses error:", err.message);
//     throw err;
//   }
// }

// FOR ZIP.zip/FOR ZIP/userService.js

// import supabase from "./supabaseClient.js";
import { supabase } from "./supabaseClient.js";

/**
 * Registers a new user in the database.
 * @param {number} telegramId The user's Telegram chat ID.
 * @param {string} username The user's Telegram username.
 * @returns {Promise<object>} The inserted user data.
 */
export async function registerUser(telegramId, username) {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existingUser) return existingUser.id; // User already registered

    const { data, error: insertError } = await supabase
      .from("users")
      .insert([{ telegram_id: telegramId, username }])
      .select("id")
      .single();

    if (insertError) throw insertError;
    return data.id;
  } catch (err) {
    console.error("registerUser error:", err.message);
    throw err;
  }
}

/**
 * Checks if a user is registered.
 * @param {number} telegramId The user's Telegram chat ID.
 * @returns {Promise<boolean>} True if the user is registered, false otherwise.
 */
export async function isUserRegistered(telegramId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error; // 'PGRST116' means no rows found

    return !!data;
  } catch (err) {
    console.error("isUserRegistered error:", err.message);
    throw err;
  }
}

/**
 * Adds a new expense for a user.
 * @param {number} telegramId The user's Telegram chat ID.
 * @param {number} amount The expense amount.
 * @param {string} category The expense category.
 * @returns {Promise<object>} The added expense data.
 */
export async function addExpense(telegramId, amount, category) {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .single();

    if (userError || !user) throw new Error("User not found");

    const { data, error: insertError } = await supabase
      .from("expenses")
      .insert([{ user_id: user.id, amount, category }])
      .select();

    if (insertError) throw insertError;
    return data;
  } catch (err) {
    console.error("addExpense error:", err.message);
    throw err;
  }
}

/**
 * Fetches a user's expenses for the current day.
 * @param {number} telegramId The user's Telegram chat ID.
 * @returns {Promise<Array<object>>} A list of expenses.
 */
export async function getTodayExpenses(telegramId) {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .single();

    if (userError || !user) throw new Error("User not found");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("expenses")
      .select("amount, category")
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("getTodayExpenses error:", err.message);
    throw err;
  }
}

/**
 * Fetches a user's expenses for the current month.
 * @param {number} telegramId The user's Telegram chat ID.
 * @returns {Promise<Array<object>>} A list of expenses.
 */
export async function getMonthlyExpenses(telegramId) {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .single();

    if (userError || !user) throw new Error("User not found");

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const lastDayOfMonth = new Date(
      firstDayOfMonth.getFullYear(),
      firstDayOfMonth.getMonth() + 1,
      0
    );
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("expenses")
      .select("amount, category, created_at")
      .eq("user_id", user.id)
      .gte("created_at", firstDayOfMonth.toISOString())
      .lte("created_at", lastDayOfMonth.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("getMonthlyExpenses error:", err.message);
    throw err;
  }
}
