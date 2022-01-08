const sheet = require('./lib/getSheet');
const mail = require('./lib/nodemailer');
const moment = require('moment');
const getData = require('./lib/getdata');
const acccn = require('./lib/youtubeacccn');
const gsDirect = require('./lib/googleSheetDirect');

const credentials = require('./credentials.json');

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

async function testyoutube() {
  /*
  const today = moment(new Date()).startOf('day');
  const YYYY = today.format('YYYY');
  const sheetId = '1u_AR8y7iCRPGyDhdOb1cHhjL-vclCIxuLkMhIxd08mU';

  const cli = await gsDirect.getClient('bibleSender2022');
  const sheetOps = cli.getSheetOps(sheetId);  
  const info = await sheetOps.info();
  //input YYYY, sheetId,
  const sheetsInfo = (info.sheets.map(s => s.properties));
  const found = sheetsInfo.find(s => s.title === YYYY);
  if (!found) {
    const rsp = await sheetOps.createSheet(YYYY).catch(err => err.response.text);
    console.log(rsp);
  }
  
  sheetId: 0,
    title: '2020',
    index: 1,
    sheetType: 'GRID',
    gridProperties: { rowCount: 998, columnCount: 26 }
  */
  //console.log(YYYY)
  //return console.log(sheetsInfo)
  return acccn.recordAcccnYoutubeCntAll('UCxIsefyl9g9A5SGWA4FvGIA').then(res => {
    console.log(res);
  }).catch(err => {
    console.log(err);
  }).then(() => {
    console.log('done')
  });
}

return testyoutube();

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