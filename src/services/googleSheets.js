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

async function obtenerPrimerasSeisPestanas() {
  try {
    // 1. Obtenemos los metadatos para listar las pestañas
    const metaResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    const todasLasHojas = metaResponse.data.sheets.map(s => s.properties.title);
    const primerasSeis = todasLasHojas.slice(0, 6);

    const datosPorPestana = {};

    // 2. Iteramos agregando comillas simples al nombre (clave si hay espacios)
    for (const nombreHoja of primerasSeis) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${nombreHoja}'!A1:Z100`, // <-- Añadidas comillas simples aquí
        });
        datosPorPestana[nombreHoja] = response.data.values || [];
      } catch (err) {
        console.warn(`No se pudo leer la pestaña "${nombreHoja}":`, err.message);
        datosPorPestana[nombreHoja] = [];
      }
    }

    return {
      nombresHojas: primerasSeis,
      contenido: datosPorPestana
    };
  } catch (error) {
    console.error("Error general al obtener las pestañas:", error);
    throw error;
  }
}

module.exports = { obtenerPrimerasSeisPestanas };