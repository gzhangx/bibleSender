const fs = require('fs');
const readline = require('readline');
const moment = require('moment-timezone');
const email = require('./nodemailer');
const keyBy = require('lodash/keyBy');
const mapValues = require('lodash/mapValues');
const get = require('lodash/get');

const sheet = require('./getSheet');
const spreadsheetId = '1H1GmNPXZBwdT2AWvPDJFZKy3LOvfERXoREgvPJ-HUsI';
async function test(days = 0) {
  const start = moment();
  for(let i = 0; i < 1;i++) {
    await checkSheetNotice(start.add(days, 'days').toDate(), false);
  }
}

//return test();

function getNextDayOfWeek(date, dayOfWeek) {
  const res = new Date(date.getTime());

  res.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);

  return res;
}

async function getTemplateData(curDate) {
  const getRows =  async range=>get(await sheet.getSheet({
    sheetInfo: {
      spreadsheetId,
      range,
    }
  }),'data.values',[]).splice(1);
  
  const rows = await getRows('Addresses');
  const names = keyBy(rows.map(r=>({name: r[0], address:r[1], additionalInformation:r[2]})).filter(x=>x.name), 'name');
  const templateRows = await getRows('Template');
  return {
    names,
    curDate,
    template: {
      have: {
        subject: templateRows[0][0],
        text: templateRows[1][0],
      },
      havenot: {
        subject: templateRows[0][1],
        text: templateRows[1][1],
      }
    }
  }
}
async function getSheetData(curDate = new Date()) {
  const getSheet = curDateD => sheet.getSheet({
    sheetInfo: {
      spreadsheetId,
      range: `'${getSheetName(curDateD)}'!A:P`,
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


function createMessage(templateAll, first, have) {
  const getRowData = (who, def)=>first.row[who] || def || 'NA';
  const openHomeOwner = getRowData(3);
  const addr = get(templateAll, `names[${openHomeOwner}.address`, `Can't find address for ${openHomeOwner}`);
  const additionalInformation = get(templateAll, `names[${openHomeOwner}.additionalInformation`,'');  
  const map = [
    {
      name: '_openhome',
      val: openHomeOwner,
    },
    {
      name:'_address',
      val: addr,
    },
    {
      name:'_additionalInformation',
      val: additionalInformation,
    },
    {
      name:'_time',
      val: getRowData(2),
    },
    {
      name:'_date',
      val: first.date,
    },
    {
      name:'_thisSaturday',
      val: moment(getNextDayOfWeek(templateAll.curDate,6)).format('YYYY-MM-DD'),
    },
    {
      name:'_verse',
      val: getRowData(4),
    },
    {
      name:'_lead',
      val: getRowData(6),
    },
    {
      name:'_song',
      val: getRowData(7),
    },
    {
      name:'_childlead',
      val: getRowData(8),
    },
    {
      name:'_childprogress',
      val: getRowData(9),
    },
    {
      name:'_childassistent',
      val: getRowData(10),
    },
    {
      name:'_snak1',
      val: getRowData(11),
    },
    {
      name:'_snak2',
      val: getRowData(12),
    }
  ];

  const rpl = data=>map.reduce((acc, cur)=>{
    return acc.replace(`{${cur.name}}`, cur.val);
  },data);

  const template = templateAll.template[have];
  const ret = mapValues(template, v=>rpl(v));  
  return ret;
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
        //to: 'gzhangx@hotmail.com',
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
      const template = await getTemplateData(curDateD);
      const messageData = createMessage(template, first, first.diff < 7? 'have':'havenot');
      Object.assign(message, messageData);
      console.log(message.subject);
      console.log(message.text);
      /*
      message.subject = `${moment(getNextDayOfWeek(curDateD,6)).format('YYYY-MM-DD')} 希伯来本周六没有团契`;
      const getRowData = who=>first.row[who] || 'NA';
      本周希伯来团契聚会 {_date}
      亲爱的弟兄姐妹:
        平安！
        
        本周六团契聚会在{_openhome}家。谢谢他们开放家庭。 
        
        地址：  {_address}
        
        {_additionalInformation}
            
        时间：{_time} on {_date}
    
        查经内容: {_verse}
        查经带领: {_lead}
        带领诗歌: {_song}
        
        小班老师: {_childlead}
        小班查经进度：{_childprogress}
        小班家长助教：{_childassistent}
                点心: 
                      1，{_snak1}
                      2，{_snak2}
        
           本季团契活动安排如下,请大家踊跃signup:
        
        https://docs.google.com/spreadsheets/d/1H1GmNPXZBwdT2AWvPDJFZKy3LOvfERXoREgvPJ-HUsI/edit#gid=0
        
        谢谢大家的摆上！
        
        Blessings!
        
        -- 
        Thanks.

        希伯来本周六没有团契 {_thisSaturday}
        亲爱的弟兄姐妹:
      平安！希伯来本周六没有团契, 下次团契聚会在{_openhome}家，时间：{_date}, 查经带领: {_lead}。 谢谢他们
      message.text = `亲爱的弟兄姐妹:
      平安！希伯来本周六没有团契, 下次团契聚会在${getRowData(3)}家，时间：${first.date}, 查经带领: ${getRowData(6)}。 谢谢他们。 
      `;
      if (first.diff < 7) {          
        message.subject = `本周希伯来团契聚会 ${getRowData(2)} `;
        message.text = `亲爱的弟兄姐妹:
        平安！
        
        本周六团契聚会在${getRowData(3)}家。谢谢他们开放家庭。 
        
        地址：  ${getRowData(13)}
        
        ${getRowData(14,' ')}
            
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
      */
    } else {
        message.subject = '';
        console.log('希伯来本周六没有团契, No Data Found');
    }

    
    if (!sendEmail) return message;
    email.sendGmail(message);
    return message;
}

function getSheetName(date) {
    const mon = date.getMonth();
    const qs = parseInt(mon/3)*3+1;
    //console.log(qs + " " + date + " " + mon);
    return `${date.getFullYear()} ${qs}-${qs+2}`;
}

module.exports = {
    checkSheetNotice,
    test,
};
