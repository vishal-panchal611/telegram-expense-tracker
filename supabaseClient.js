// const { createClient } = require("@supabase/supabase-js");

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;

// // Safe logging: show only first 6 characters (rest masked)
// console.log("🔧 Supabase Config:");
// console.log(
//   "   URL:",
//   supabaseUrl ? supabaseUrl.slice(0, 25) + "..." : "❌ MISSING"
// );
// console.log(
//   "   Key:",
//   supabaseKey ? supabaseKey.slice(0, 6) + "..." : "❌ MISSING"
// );

// if (!supabaseUrl || !supabaseKey) {
//   console.error("❌ Supabase environment variables are missing!");
// }

// const supabase = createClient(supabaseUrl, supabaseKey);

// module.exports = supabase;

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Safe logging: show only first 6 characters (rest masked)
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

// ✅ Export the client using ES Module syntax
export { supabase };
