const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const moment = require('moment-timezone');
const mailgun = require('./mailgun');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

async function test() {
  const start = moment().add(-30,'days')
  for(let i = 0; i < 35;i++) {
    await checkSheetNotice(start.add(1, 'days').toDate());
  }
}

//test();

function checkSheetNotice(curDate = new Date()) {
    console.log(curDate);
    // Load client secrets from a local file.
    const content = fs.readFileSync('credentials.json');
    // Authorize a client with credentials, then call the Google Sheets API.
    return authorize(JSON.parse(content), listMajors, curDate);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, curDate) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  return new Promise((resolve,reject)=>{
      const prm = {resolve, reject, curDate};
    fs.readFile(TOKEN_PATH, (err, token) => {
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


function getSheetName(date) {
    const mon = date.getMonth();
    const qs = parseInt(mon/3)*3+1;
    //console.log(qs + " " + date + " " + mon);
    return `${date.getFullYear()} ${qs}-${qs+2}`;
}
/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth, prm) {
    if (prm.curDate.getDay() !== 2 && prm.curDate.getDay() !== 5) return prm.resolve({
        message:'Not Tue or Fri'
    });
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    //spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    spreadsheetId: '1H1GmNPXZBwdT2AWvPDJFZKy3LOvfERXoREgvPJ-HUsI',
    range: `'${getSheetName(prm.curDate)}'!A:K`,
  }, (err, res) => {
    if (err) {
         console.log('The API returned an error: ' + err);
         return prm.reject(err);
    }
    const rows = res.data.values;
    if (rows.length) {
      //console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      const curDate = moment(prm.curDate);
      const goodRows = rows.map((row) => {
        const date = moment(row[0]);
        if (row[0] && date.isValid()) {
            //console.log(`${date.toDate()}, ${row[0]}`);
            if (date.isAfter(curDate)) {
                return {
                    row,
                    date: date.format("YYYY-MM-DD"),
                    diff: date.diff((prm.curDate), 'days'),
                }
            }
        }
      }).filter(x=>x).sort((a,b)=>a.diff-b.diff);
      //console.log(goodRows);
      if (goodRows.length === 0) {
          return prm.resolve({
              message:'No Data'
          });
      }
      const first = goodRows[0];
      let subject = `${first.date} 希伯来本周六没有团契`;
      let emailMessage = `亲爱的弟兄姐妹:
      平安！希伯来本周六没有团契
      `;
      if (first.diff < 7) {
          const getRowData = who=>first.row[who] || 'NA';
        const emailMessage = `亲爱的弟兄姐妹:
        平安！
        
        本周六团契聚会在${getRowData(3)}家。谢谢他们开放家庭。 
        
        地址：  ${getRowData(12)}
        
        ${getRowData(13)}
            
        时间：${getRowData(2)} on ${first.date}
    
        查经内容: ${getRowData(4)}
        查经带领: ${getRowData(6)}
        带领诗歌: ${getRowData(7)}
        
        小班老师: ${getRowData(8)}
        小班查经进度：${getRowData(9)}
        小班家长助教：${getRowData(10)}
                点心: 
                      1，${getRowData(11)}
                      2，${getRowData(12)}
        
           本季团契活动安排如下,请大家踊跃signup:
        
        https://docs.google.com/spreadsheets/d/1H1GmNPXZBwdT2AWvPDJFZKy3LOvfERXoREgvPJ-HUsI/edit#gid=0
        
        谢谢大家的摆上！
        
        Blessings!
        
        -- 
        Thanks.`;
          console.log(emailMessage);
      }else {
          console.log(subject);
      }
    } else {
        subject = '';
        console.log('希伯来本周六没有团契, No Data Found');
    }

    return mailgun.sendMailByMailGun({
        subject,
        text: emailMessage,
    }).then(prm.resolve)
  });
};


module.exports = {
    checkSheetNotice,
};