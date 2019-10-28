const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];


function getSheet(opt) {
    // Load client secrets from a local file.
    const content = fs.readFileSync('credentials.json');
    // Authorize a client with credentials, then call the Google Sheets API.
    return authorize(JSON.parse(content), listMajors, opt);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, opt) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  return new Promise((resolve,reject)=>{
      const prm = {resolve, reject, opt};
    fs.readFile(opt.TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback, prm);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, prm);
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback, prm) {
   const TOKEN_PATH = prm.opt.TOKEN_PATH;
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
         return prm.reject(err);
       }
       oAuth2Client.setCredentials(token);
       // Store the token to disk for later program executions
       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
         if (err) {
             console.error(err);
             return prm.reject(err);
         }
         console.log('Token stored to', TOKEN_PATH);
       });
       callback(oAuth2Client, prm);
     });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth, prm) {    
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get(prm.opt.sheetInfo, (err, res) => {
    if (err) {
         console.log('The API returned an error: ' + err);
         return prm.reject(err);
    }
    return prm.resolve(res);
  });
};


module.exports = {
    getSheet,
};