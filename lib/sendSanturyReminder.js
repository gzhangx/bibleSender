const spreadsheetId = '1wbD1eFyCZAQTxPCKEp1wxVaZkDzwN0dwaemBR08mFLw';
const moment = require('moment-timezone');
const sheet = require('./getSheet');
const email = require('./nodemailer');

async function test() {
  const start = moment().add(-20,'days')
  for(let i = 0; i < 2;i++) {    
    const d = start.add(1, 'days').toDate();
    await checkSanturyNotice(d, false);
    //console.log("curd = " + d.toISOString());
    //console.log(getSdayNextMonth(d));
  }
}

function getSdayNextMonth(curDate) {
    let nmSdi = i=>new Date(curDate.getFullYear(), curDate.getMonth() + 1, i);
    const nd = nmSdi(1);
    if (nd.getDay() !== 0) {
        return nmSdi(7-nd.getDay() + 1);
    }
    return nd;
}
async function checkSanturyNotice(curDateD = new Date(), sendEmail = true) {    
    if (curDateD.getDate() !== 15 && curDateD.getDate() !== 26) return {
      message:'Not right date'
    };
    console.log(`${curDateD} checkSanturyEmail=${sendEmail} ${curDateD.getDate()}`);        
    //if (curDateD.getDay() !== 2 && curDateD.getDay() !== 5) return ({
    //  message:'Not Tue or Fri'
    //});

    let nmSdi = getSdayNextMonth(curDateD);
    
    const month = nmSdi.getMonth() + 1;
    const res = await sheet.getSheet({
      TOKEN_PATH: 'santuryReminderToken.json',
      sheetInfo: {
        spreadsheetId,
        range: `'Current'!A:J`,
      }
    });

    const rows = res.data.values[month];
    //console.log(rows);

    const year = nmSdi.getFullYear();
    
    
      const curMd = moment(nmSdi);

      const tuanqi = rows[1].split('（')[1].replace('）','');
      const emails = ['gzhangx@hotmail.com', 'fred.j.fu@gmail.com',rows[3],rows[5],rows[7],rows[9]].filter(x=>x).join(',');
      const message = {
        from: '"Acccn Santury Service" <gzhangx@gmail.com>',      
          to: emails,  
        subject:`${year}年主日崇拜招待${month}月`,
        text: 'NA',      
      };
      message.text = `${tuanqi}團契主席和輔導同工們，
      謝謝貴團契過去在主日崇拜做招待的服事，也盼望你們在${year}年靠主恩典繼續服事！教会${month}月招待服事由你們负责，${month}月${nmSdi.getDate()}号开始，每週5-6人 ，麻烦您安排一下。 请回复确认。谢谢。
      
       
      
      具体的服 事事项如下：
      
          崇拜前20分钟到教会，3人分别在3個入口處负责分发单张。另外3人在大堂内负责引领会友至座位。尽量安排会友往前往中間座位移動坐满固定座位。
      
           崇拜开始后，关闭大堂靠近教会前方大門的两个入口，並如同上述负责引领会友至座位。尽量安排会友從左右两边的4條走道入座坐满固定座位。一旦坐满，请帮忙排放折叠椅然后再引领会友去折叠椅区就坐。
      
           祷告时请关闭入口，祷告结束后打开入口让会友进入。
      
          诗班献诗时，请关闭入口，结束后打开入口让会友进入。原则上是先引领会友先坐里面固定座位区域。 一旦坐满，如须增加椅子请帮忙排放折叠椅然后再引领会友去折叠椅区开放就坐。
      
           讲道开始后，尽量不再引导会友去大堂中间区域以避免影响讲道。
      
           如果座位不够，请从储存处搬运更多的折叠椅, 结束后请将折叠椅搬回。
      
           大概10点20分左右，清点人数。具体请看表格。请尽量从两侧进行点数，不要从会堂中间，以免影响讲道。(教会大堂固定座位504个) 
          每月的第一个主日，饼杯后由4位同工负责收集杯子。
      
          一般会有两个招待同工随时协助你们。
      
      
      招待員須知：
              1.    招待員必須在主日早上9:25分之前到達教會。
              2.    服裝乾淨整齊:
                     弟兄襯衫配長褲(西裝領帶最佳);不能穿牛仔褲及圓領汗衫。
                     姐妹襯衣配裙或褲（正裝最佳）, 不能穿牛仔褲/裙及運動鞋、拖鞋或露出腳趾的鞋。
              3.    儀錶端莊,頭髮梳理整齊,姐妹可化淡妝(如塗口紅等)。
              4.    每位招待員都須清楚瞭解自己的工作範圍及重點,若有疑問應及時向組長詢問。
              5.    若遇到特殊情況,組長應及時通知組員, 確保招待工作正常進行。
              6.    招待員有事請假應事先自行安排代替者並通知組長;務必確保當天服事不受影響.
              7.    請組長在每月初提醒組員不要忘記。
      `;
      console.log(`${emails} ${message.subject} ${message.text}`);
      //console.log(message);
      if (sendEmail)
        email.sendGmail(message);
      return message;
}

module.exports = {
    checkSanturyNotice,
};
