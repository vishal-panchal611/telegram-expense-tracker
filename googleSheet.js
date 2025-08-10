// // googleSheet.js
// const { google } = require("googleapis");
// const path = require("path");

// // Authenticate using service account
// const auth = new google.auth.GoogleAuth({
//   keyFile: path.join(__dirname, "credentials.json"),
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

// const spreadsheetId = "1xbGxh6RPEGLIKdQTZ3n-EfAn58_XLBPC7BgAdTkC7nE"; // Replace this

// // Main categories for classification
// const categoryMap = {
//   vadapav: "Food",
//   samosa: "Food",
//   coffee: "Food",
//   burger: "Food",
//   metro: "Travel",
//   rickshaw: "Travel",
//   cab: "Travel",
//   movie: "Entertainment",
//   recharge: "Utilities",
//   rent: "Housing",
// };

// function classifyCategory(input) {
//   const lower = input.toLowerCase();
//   return categoryMap[lower] || "Miscellaneous";
// }

// async function addExpense(amount, category) {
//   const client = await auth.getClient();
//   const sheets = google.sheets({ version: "v4", auth: client });

//   const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
//   const mainCategory = classifyCategory(category);

//   await sheets.spreadsheets.values.append({
//     spreadsheetId,
//     range: "Sheet1!A:D",
//     valueInputOption: "USER_ENTERED",
//     requestBody: {
//       values: [[date, amount, category, mainCategory]],
//     },
//   });

//   return mainCategory;
// }

// module.exports = { addExpense };

const { google } = require("googleapis");

// Load credentials from environment variable
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Authenticate using service account
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = "1xbGxh6RPEGLIKdQTZ3n-EfAn58_XLBPC7BgAdTkC7nE"; // Replace this

// Main categories for classification
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

async function addExpense(amount, category) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const mainCategory = classifyCategory(category);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[date, amount, category, mainCategory]],
    },
  });

  return mainCategory;
}

module.exports = { addExpense };
