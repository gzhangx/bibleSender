const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const credentials = require('../credentials.json');

// If modifying these scopes, delete token.json. //'https://www.googleapis.com/auth/spreadsheets.readonly'
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(ggcredentials) {
  //const { client_secret, client_id, redirect_uris } = ggcredentials; //credentials.googleSheet.installed;
  const oAuth2Client = getGoogleClient(ggcredentials);

  // Check if we have previously stored a token.
  if (!credentials.googleSheet.token) {
     credentials.googleSheet.token = await getNewToken(oAuth2Client);
     fs.writeFileSync('credentials.json', JSON.stringify(credentials));
  }
  oAuth2Client.setCredentials(credentials.googleSheet.token);
  return oAuth2Client;
}

function getGoogleClient(ggcredentials) {
  const { client_secret, client_id, redirect_uris } = ggcredentials; //credentials.googleSheet.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);
  return oAuth2Client;
}
function authorize1GetUrl(ggcredentials) {
  const oAuth2Client = getGoogleClient(ggcredentials);
  // Check if we have previously stored a token.
  if (credentials.googleSheet.token) return null;
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  return authUrl;
}

async function authorize2CodeToToken(ggcredentials, code) {
  const oAuth2Client = getGoogleClient(ggcredentials);
  return new Promise((resolve, reject) => {
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('Error while trying to retrieve access token', err);
        return reject(err);
      }
      credentials.googleSheet.token = token;
      fs.writeFileSync('credentials.json', JSON.stringify(credentials));
      return resolve(token);
    });
  });  
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject)=>{
   const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
   });
   console.log('Authorize this app by visiting this url:', authUrl);
   const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout,
   });
   rl.question('Enter the code from that page here: ', (code) => {
     rl.close();
     oAuth2Client.getToken(code, (err, token) => {
       if (err) {
          console.error('Error while trying to retrieve access token', err);
         return reject(err);
       }
        return resolve(token);
     });
    });
  });
}

function getSheetAuthUrl() {
  return authorize1GetUrl(credentials.googleSheet.installed);
}
function authorizeWithCode(code) {
  return authorize2CodeToToken(credentials.googleSheet.installed, code);
}

async function getSheet() {
  //const content = credentials;
  // Authorize a client with credentials, then call the Google Sheets API.
  const auth = await authorize(credentials.googleSheet.installed);
  const sheets = google.sheets({version: 'v4', auth});
  return sheets;
}

async function readSheet(spreadsheetId, range) {
  // Load client secrets from a local file.  
  const sheets = await getSheet();
  return new Promise((resolve,reject)=>{
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    }, (err, res) => {
      if (err) {
         console.log('The API returned an error: ' + err);
         return reject(err);
      }
      return resolve(res);
    });
  });
}

async function readRanges(spreadsheetId, ranges) {
  // Load client secrets from a local file.  
  const sheets = await getSheet();
  return new Promise((resolve,reject)=>{
    sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    }, (err, res) => {
      if (err) {
         console.log('The API returned an error: ' + err);
         return reject(err);
      }
      return resolve(res);
    });
  });
}

async function updateSheet(spreadsheetId, range, values, valueInputOption = 'RAW' ) {
  const sheets = await getSheet();
  return sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption,
    resource: {
      values
    }
  }).then(response => {
    var result = response.data;
    //console.log(`${result} cells updated.`);
    return result;
  });
}


async function appendSheet(spreadsheetId, range, values, valueInputOption = 'RAW' ) {
  const sheets = await getSheet();
  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption,
    resource: {
      values
    }
  }).then(response => {
    var result = response.data;
    //console.log(`${result} cells updated.`);
    return result;
  });
}

module.exports = {
  authorize1GetUrl,
  authorize2CodeToToken,
  getSheetAuthUrl,
  authorizeWithCode,
  getSheet,
  readSheet,
  readRanges,
  appendSheet,
  updateSheet,
};