// services/googleSheets.js
const { google } = require("googleapis");

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"], // Permiso de solo lectura
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * Lee un rango de la hoja para verificar la conexión y traer datos
 * @param {String} rango Rango a consultar, por defecto las primeras filas y columnas
 */
async function leerDatosPrueba(rango = "Listado instrumental Sebia!A1:E5") {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rango,
    });
    
    return response.data.values; // Retorna la matriz de filas y columnas
  } catch (error) {
    console.error("Error leyendo Google Sheets:", error);
    throw error;
  }
}

module.exports = { leerDatosPrueba };