import { supabase } from "./supabaseClient.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

export async function registerUser(telegramId, username) {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existingUser) return existingUser.id;

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

export async function isUserRegistered(telegramId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;

    return !!data;
  } catch (err) {
    console.error("isUserRegistered error:", err.message);
    throw err;
  }
}

async function getOrInferCategory(item) {
  const lowerCaseItem = item.toLowerCase(); // ✅ Convert to lowercase

  const { data, error } = await supabase
    .from("categories")
    .select("category")
    .eq("item", lowerCaseItem) // ✅ Use lowercase for the query
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Supabase category fetch error:", error.message);
  }

  if (data) {
    console.log(
      `✅ Found category for '${lowerCaseItem}' in DB: ${data.category}`
    );
    return data.category;
  }

  console.log(`🧠 Inferring category for '${lowerCaseItem}' using LLM...`);
  try {
    const prompt = `What is the category for '${lowerCaseItem}'? Respond with only a single word for the category (e.g., 'Food', 'Transport', 'Utilities'). If you are unsure, use 'Miscellaneous'.`;
    const result = await model.generateContent(prompt);
    const inferredCategory = result.response.text().trim();
    console.log(`✅ LLM inferred category: ${inferredCategory}`);

    const { data: newCategory, error: insertError } = await supabase
      .from("categories")
      .insert([{ item: lowerCaseItem, category: inferredCategory }]) // ✅ Use lowercase for insertion
      .select();

    if (insertError) {
      console.error("Supabase insert category error:", insertError.message);
    }

    return inferredCategory;
  } catch (llmError) {
    console.error("❌ LLM API call failed:", llmError.message);
    return "Miscellaneous";
  }
}

export async function addExpense(telegramId, amount, item) {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .single();

    if (userError || !user) throw new Error("User not found");

    const category = await getOrInferCategory(item);

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
