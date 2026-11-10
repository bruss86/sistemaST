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
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

async function obtenerPrimeraHojaSieteColumnas() {
  try {
    // 1. Obtenemos los metadatos para identificar el título de la primera hoja
    const metaResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    const todasLasHojas = metaResponse.data.sheets.map(s => s.properties.title);
    if (todasLasHojas.length === 0) {
      throw new Error("El documento de Google Sheets no contiene hojas.");
    }

    const primeraHoja = todasLasHojas[0]; // Selecciona estrictamente la primera hoja

    // 2. Solicitamos únicamente las columnas de la A hasta la G (primeras 7 columnas)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${primeraHoja}'!A1:G`,
    });

    const datosHoja = response.data.values || [];

    return {
      nombresHojas: [primeraHoja],
      contenido: {
        [primeraHoja]: datosHoja
      }
    };
  } catch (error) {
    console.error("Error al obtener la primera hoja de Google Sheets:", error);
    throw error;
  }
}

module.exports = { obtenerPrimerasSeisPestanas: obtenerPrimeraHojaSieteColumnas };