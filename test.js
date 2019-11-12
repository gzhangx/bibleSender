function test() {
  const testSendWeeklyNotice = require('./lib/getNotice');
  testSendWeeklyNotice.test(0);
}

return test();

const sheet = require('./lib/getSheet');
sheet.getSheet({
  TOKEN_PATH: 'token.txt',
  sheetInfo: {
    spreadsheetId: '1H1GmNPXZBwdT2AWvPDJFZKy3LOvfERXoREgvPJ-HUsI',
    range: `'2019 1-3'!A:K`,
  }
}).then(res=>console.log(res))
return;
const mail = require('./lib/nodemailer');

mail.sendGmail({
  from: '"HebrewsBot" <gzhangx@gmail.com>',
  to:'gzhangx@hotmail.com',
  subject:'testsub1',
  text:'testtext2'
})
return;
const t = require('./lib/getdata');
t.SendEmail().then(d=>{
console.log('done');
console.log(d);
}).catch(err=>{
  console.log(err);
});