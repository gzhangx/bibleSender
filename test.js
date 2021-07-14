const sheet = require('./lib/getSheet');
const mail = require('./lib/nodemailer');
const moment = require('moment');
const getData = require('./lib/getdata');

function testDailyEmail() {
  const ret = getData.loadData(moment('2021-04-04'), './lib/schedule.txt');
  return console.log(ret.data.split('\n').length);
  return getData.sendEmail({
    now: moment('2021-04-04'),
    scheduleFileName: './lib/scheduleJinlin.txt',
    from: '"JY Daily Bible verse test" <test@test.com>',
    to: 'test@test.com',
  });
}
//return testDailyEmail();
//return testEmail();

async function test() {
  const testSendWeeklyNotice = require('./lib/sendHebrewsWeeklyEmail');
  const msg = await testSendWeeklyNotice.checkSheetNotice(new Date(), false);
  console.log(msg);
  return;
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