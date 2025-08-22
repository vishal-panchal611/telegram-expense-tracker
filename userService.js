const { supabase } = require("./supabaseClient");

async function registerUser(telegramId, username) {
  // Check if user already exists
  let { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (data) {
    return data.id; // already registered
  }

  // Insert new user
  let { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert([{ telegram_id: telegramId, username }])
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  return newUser.id;
}

module.exports = { registerUser };
