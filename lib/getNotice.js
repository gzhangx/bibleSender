const fs = require('fs');
const readline = require('readline');
const moment = require('moment-timezone');
const email = require('./nodemailer');

const sheet = require('./getSheet');

async function test() {
  const start = moment().add(-30,'days')
  for(let i = 0; i < 15;i++) {
    await checkSheetNotice(start.add(1, 'days').toDate(), false);
  }
}

//return test();

function getNextDayOfWeek(date, dayOfWeek) {
  const res = new Date(date.getTime());

  res.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);

  return res;
}

async function getSheetData(curDate = new Date()) {
  const getSheet = curDateD => sheet.getSheet({
    sheetInfo: {
      spreadsheetId: '1H1GmNPXZBwdT2AWvPDJFZKy3LOvfERXoREgvPJ-HUsI',
      range: `'${getSheetName(curDateD)}'!A:K`,
    }
  });

  const d1 = await getSheet(curDate);
  const date1m = new Date(curDate.getTime());
  date1m.setMonth(curDate.getMonth() + 1);
  let vals = d1.data.values;
  try {
    const d2 = await getSheet(date1m);
    vals = vals.concat(d2.data.values);
  } catch (err) {
    console.log(err);
  }
  return vals;
}

async function checkSheetNotice(curDateD = new Date(), sendEmail = true) {
    console.log(`${curDateD} sendEmail=${sendEmail}`);
    if (curDateD.getDay() !== 2 && curDateD.getDay() !== 5) return ({
      message:'Not Tue or Fri'
    });
    const rows = await getSheetData(curDateD);

    const message = {
      from: '"HebrewsBot" <gzhangx@gmail.com>',      
        to: 'hebrewsofacccn@googlegroups.com',  //nodemailer settings, not used here
      subject:'NA',
      text: 'NA',      
    };


    if (rows.length) {
      //console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      const curDate = moment(curDateD);
      const goodRows = rows.map((row) => {
        const date = moment(row[0]);
        if (row[0] && date.isValid()) {
            //console.log(`${date.toDate()}, ${row[0]}`);
            if (date.isAfter(curDate)) {
                return {
                    row,
                    date: date.format("YYYY-MM-DD"),
                    diff: date.diff((curDate), 'days'),
                }
            }
        }
      }).filter(x=>x).sort((a,b)=>a.diff-b.diff);
      //console.log(goodRows);
      if (goodRows.length === 0) {
          return {
              message:'No Data'
          };
      }
      const first = goodRows[0];
      message.subject = `${moment(getNextDayOfWeek(curDateD,6)).format('YYYY-MM-DD')} 希伯来本周六没有团契`;
      const getRowData = who=>first.row[who] || 'NA';
      message.text = `亲爱的弟兄姐妹:
      平安！希伯来本周六没有团契, 下次团契聚会在${getRowData(3)}家，时间：${first.date}, 查经带领: ${getRowData(6)}。 谢谢他们。 
      `;
      if (first.diff < 7) {          
        message.text = `亲爱的弟兄姐妹:
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
          console.log(message.text);
      }else {
          console.log(message.subject);
          console.log(message.text);
      }
    } else {
        message.subject = '';
        console.log('希伯来本周六没有团契, No Data Found');
    }

    
    if (!sendEmail) return message;
    email.sendGmail(message);
}

function getSheetName(date) {
    const mon = date.getMonth();
    const qs = parseInt(mon/3)*3+1;
    //console.log(qs + " " + date + " " + mon);
    return `${date.getFullYear()} ${qs}-${qs+2}`;
}

module.exports = {
    checkSheetNotice,
};
