// services/gmailService.js

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

console.log({
  CLIENT_ID: !!process.env.GMAIL_CLIENT_ID,
  CLIENT_SECRET: !!process.env.GMAIL_CLIENT_SECRET,
  REFRESH_TOKEN: !!process.env.GMAIL_REFRESH_TOKEN,
});

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

module.exports = gmail;