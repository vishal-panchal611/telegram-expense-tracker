import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log("🔧 Supabase Config:");
console.log(
  "   URL:",
  supabaseUrl ? supabaseUrl.slice(0, 25) + "..." : "❌ MISSING"
);
console.log(
  "   Key:",
  supabaseKey ? supabaseKey.slice(0, 6) + "..." : "❌ MISSING"
);

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase environment variables are missing!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
