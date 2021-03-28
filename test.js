const sheet = require('./lib/getSheet');
const mail = require('./lib/nodemailer');
const moment = require('moment');
const getData = require('./lib/getdata');

function testDailyEmail() {
  return getData.sendEmail({
    now: moment('2021-03-27'),
    scheduleFileName: './lib/scheduleJinlin.txt',
    from: '"JY Daily Bible verse test" <gzhangx@gmail.com>',
    to: 'gzhangx@hotmail.com,jinlinx@hotmail.com',
  });
}
return testDailyEmail();
//return testEmail();

function test() {
  const testSendWeeklyNotice = require('./lib/sendHebrewsWeeklyEmail');
  return testSendWeeklyNotice.getNewSheetData();
  //return testSendWeeklyNotice.initSheetData();
  //testSendWeeklyNotice.test(0);
  const sendSan = require('./lib/sendSanturyReminder');
  sendSan.checkSanturyNotice(new Date(), false);
}

return test();


sheet.appendSheet('1fcSgz1vEh5I3NS5VXCx1BHitD_AAQrmUCXNJPPSyDYk', `'Sheet1'!A1`,[[new Date(),'ZZ']]);
return;


function testEmail() {
  mail.sendGmail({
    from: '"HebrewsBot" <gzhangx@gmail.com>',
    to: 'gzhangx@hotmail.com',
    subject: 'testsub1',
    text: 'testtext2'
  })
}
return;
const t = require('./lib/getdata');
t.SendEmail().then(d=>{
console.log('done');
console.log(d);
}).catch(err=>{
  console.log(err);
});