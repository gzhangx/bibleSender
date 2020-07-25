function test() {
  //const testSendWeeklyNotice = require('./lib/sendHebrewsWeeklyEmail');
  //testSendWeeklyNotice.test(0);
  const sendSan = require('./lib/sendSanturyReminder');
  sendSan.checkSanturyNotice(new Date(), false);
}

//return test();

const sheet = require('./lib/getSheet');
sheet.appendSheet('1fcSgz1vEh5I3NS5VXCx1BHitD_AAQrmUCXNJPPSyDYk', `'Sheet1'!A1`,[[new Date(),'ZZ']]);
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