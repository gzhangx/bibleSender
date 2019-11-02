const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];


async function getSheet(opt) {
  // Load client secrets from a local file.
  const content = fs.readFileSync('credentials.json');
  // Authorize a client with credentials, then call the Google Sheets API.
  const auth = await authorize(JSON.parse(content));
  const sheets = google.sheets({version: 'v4', auth});
  return new Promise((resolve,reject)=>{
    sheets.spreadsheets.values.get(opt.sheetInfo, (err, res) => {
      if (err) {
         console.log('The API returned an error: ' + err);
         return reject(err);
      }
      return resolve(res);
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  if (!credentials.token) {
     credentials.token = await getNewToken(oAuth2Client);
     fs.writeFileSync('credentials.json', JSON.stringify(credentials));
  }
  oAuth2Client.setCredentials(credentials.token);
  return oAuth2Client;
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



module.exports = {
    getSheet,
};