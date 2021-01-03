const fs = require('fs');
const readline = require('readline');
const moment = require('moment-timezone');
const email = require('./nodemailer');
const keyBy = require('lodash/keyBy');
const mapValues = require('lodash/mapValues');
const get = require('lodash/get');
const flow = require('lodash/flow');
const Promise = require('bluebird');
const { flatMap } = require('lodash');

const sheet = require('./getSheet').createSheet();
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
  const getRows =  async range=>get(await sheet.readSheet(
      spreadsheetId,
      range),'data.values',[]).splice(1);
  
  const rows = await getRows('Addresses');
  const names = keyBy(rows.map(r=>({name: r[0], address:r[1], additionalInformation:r[2]})).filter(x=>x.name), 'name');
  const templateRows = await getRows('Template');
  const toAddrs = [];
  for (let i = 0; i < templateRows.length; i++) {
    const em = templateRows[i][2];
    if (em) {
      toAddrs.push(em);
    }
  }
  console.log(toAddrs);
  return {
    names,
    curDate,
    toAddrs,
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
  const getSheet = curDateD => sheet.readSheet(spreadsheetId,`'${getSheetName(curDateD)}'!A:P`);

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
  const ownerLookup = (openHomeowner,name) => get(templateAll, `names[${openHomeOwner}.${name}`, `Can't find address for ${openHomeOwner}`);
  //const additionalInformation = get(templateAll, `names[${openHomeOwner}.additionalInformation`,'');  
  const map = [    
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
  ];

  const addrToPos = x => x.charCodeAt(0) - 65;
  const getRowDataByLetter = x => getRowData(addrToPos(x[1]));
  const rpls = [data => map.reduce((acc, cur) => {
      return acc.replace(`\${${cur.name}}`, cur.val);
    }, data),
    data => data.replace(new RegExp('[$]{([A-Z])}', 'gi'), (...m) => getRowDataByLetter(m)),
    ...['address', 'additionalInformation'].map(name => 
      data => data.replace(new RegExp(`[$]{${name}[(]([A-Z])[)]}`, 'gi'), (...m) => {
        const owner = getRowDataByLetter(m);
        return ownerLookup(owner, name);
      })
    ),
  ];

  const template = templateAll.template[have];
  const ret = mapValues(template, flow(rpls));  
  return ret;
}
async function checkSheetNotice_Old(curDateD = new Date(), sendEmail = true) {
    console.log(`${curDateD} sendEmail=${sendEmail}`);
    //if (curDateD.getDay() !== 2 && curDateD.getDay() !== 5) return ({
    //  message:'Not Tue or Fri'
    //});
    const rows = await getSheetData(curDateD);

    const message = {
      from: '"HebrewsBot" <gzhangx@gmail.com>',      
        //to: 'hebrewsofacccn@googlegroups.com',  //nodemailer settings, not used here
      to: 'gzhangx@hotmail.com,yyz2005@hotmail.com',
      subject:'NA',
      text: 'NA',      
    };


    if (rows.length) {
      //console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      const curDate = moment(curDateD).startOf('day');
      let ended = false;
      const goodRows=rows.map((row) => {
        const row0=row[0];
        if (!row0) return;
        if (ended) return;
        if (row0 === 'Church Schedule') {
          ended = true;
          return;
        }
        if (!row0.match(/^[ \t]*\d{4}-\d{2}-\d{2}$[ \t]*/)) return;        
        const date = moment(row0);
        if (date.isValid()) {
            //console.log(`${date.toDate()}, ${row[0]}`);
          if(date.isSameOrAfter(curDate)) {
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
      message.to = template.toAddrs.join(',');
      const messageData = createMessage(template, first, first.diff < 7? 'have':'havenot');
      Object.assign(message, messageData);
      console.log(message.to);
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


async function initSheetData() {    
  const doMonth = async month => {
    //TODO: change this to next year
    let start = moment('2021-01-01').add(month, 'month').clone();
    const year = start.year();
    const curDateD = start.clone().toDate();
    for (let i = 0; i < 7; i++) {
      if (start.day() === 6) break;
      start = start.add(1, 'day');
    }
    const max = start.clone().startOf('month').clone().add(2, 'month').endOf('month').clone();

    const dateSorter = (a, b) => {
      if (a.date > b.date) return 1;
      if (a.date < b.date) return -1;
      return 0;
    };
    const getChurchSchedule = async () => {
      //TODO: change this to next years calendar
      const mapped = await Promise.map(moment.monthsShort().slice(month, month+3), async (mon, monthNum) => {
        const rv = await sheet.readSheet('13x-0a9jKCFxSVmN90K9QOpamLUNWb4V5_cvE8RaeYDw', `'${mon}'!B5:F30`);
        //console.log(rv.data.values);
        return rv.data.values.map(r => {
          const dateMoment = moment(new Date(year, monthNum, r[0]));
          const dateStr = dateMoment.format('YYYY-MM-DD');
          //console.log(dateStr + ' ' + mon + ' ' + JSON.stringify(r));        
          return {
            date: dateStr,
            weekDay: r[1],
            time: r[2],
            what: r[3],
            content: r[4],
            isChurch: true,
          }
        });
      }, { concurrency: 2 });
      const allSchedule = flatMap(mapped).sort(dateSorter);
      return allSchedule;
    }
    const allSchedule = await getChurchSchedule();
    while (start.isSameOrBefore(max)) {
      //data.push(['x' + start.format('YYYY-MM-DD'), '星期六', '7:30pm - 9:30pm']);
      allSchedule.push({
        date: start.format('YYYY-MM-DD'),
        weekDay: '星期六',
        time: '7:30pm - 9:30pm',
        what: '',
        content: '???',
        isChurch: false,
      })
      start = start.add(1, 'week').clone();
      //console.log(`start = ${start.format('YYYY-MM-DD')} max=${max.format('YYYY-MM-DD')}`)
    }
    //console.log(`aastart = ${start.format('YYYY-MM-DD')} max=${max.format('YYYY-MM-DD')}`)
    allSchedule.sort(dateSorter);
    const data = allSchedule.reduce((acc, s) => {
      //acc.data.push([`${s.date}`, s.weekDay, s.time, s.what, s.content]);
      if (!s.isChurch || (s.isChurch && s.weekDay === 'Sat'))
        acc.data.push(s);
      const mon = moment(s.date).month()
      //console.log(`start = ${start.format('YYYY-MM-DD')} max=${max.format('YYYY-MM-DD')}`)
      if (acc.mon !== mon) {        
        //data.push(['', '', '', '', '']);
        acc.data.push({
          date: '',
          weekDay: '',
          time: '',
          what: '',
          content: '',          
        })
        acc.mon = mon;
      }
      return acc;
    }, {
      data: [],
      mon: moment(allSchedule[0].date).month(),
    }).data.map(s => {
      const date = s.date === '' ? '' :
        `${s.isChurch?'C':'X'}${s.date}`;
      return ([date, s.weekDay, s.time, s.what, s.content]);
    }).concat(
      [
        [''],
        [''],
        [''],
        ['备注：请大家不要随意改动日期的格式，中文/英文日期是因为自动程序的需要'],
        ['备注：如果选中那天查经，请将那天日期前的‘X‘去掉'],
      ]
    )
    
    console.log(data);
    
    await sheet.updateSheet(spreadsheetId, `'${getSheetName(curDateD)}'!A3:E${3 + data.length}`, data);
    
    const churchdata = [
      [''], [''], [''],
      ['Church Schedule']
    ].concat(allSchedule.filter(r=>r.isChurch).map(s => {
      return ([s.date, s.weekDay, s.time, s.what, s.content]);
    }));
    await sheet.appendSheet(spreadsheetId, `'${getSheetName(curDateD)}'!A:E`, churchdata);
  }
  
  await Promise.map([0, 3, 6, 9], async mon => {
    console.log(`doing month ${mon}`);
    await doMonth(mon);
    console.log(`done momth ${mon}`);
  }, {concurrency:1});  
}

const addrToPos = x => x.charCodeAt(0) - 65;
function createMessage2021(templateAll, first, have) {
  const getRowData = (who, def) => first[who] || def || 'NA';
  const openHomeOwner = getRowData('location');
  const ownerLookup = (openHomeowner, name) => get(templateAll, `names[${openHomeOwner}.${name}`, `Can't find address for ${openHomeOwner}`);
  //const additionalInformation = get(templateAll, `names[${openHomeOwner}.additionalInformation`,'');  
  const map = [
    {
      name: '_time',
      val: getRowData('time'),
    },
    {
      name: '_date',
      val: first.date,
    },
    {
      name: '_thisSaturday',
      val: moment(getNextDayOfWeek(templateAll.curDate, 6)).format('YYYY-MM-DD'),
    },
  ];

  
  const getRowDataByLetter = x => getRowData(addrToPos(x[1]));
  const rpls = [data => map.reduce((acc, cur) => {
    return acc.replace(`\${${cur.name}}`, cur.val);
  }, data),
  data => data.replace(new RegExp('[$]{([A-Z])}', 'gi'), (...m) => getRowDataByLetter(m)),
  ...['address', 'additionalInformation'].map(name =>
    data => data.replace(new RegExp(`[$]{${name}[(]([A-Z])[)]}`, 'gi'), (...m) => {
      const owner = getRowDataByLetter(m);
      return ownerLookup(owner, name);
    })
  ),
  ];

  const template = templateAll.template[have];
  const ret = mapValues(template, flow(rpls));
  return ret;
}

async function checkSheetNotice(curDateD = new Date(), sendEmail = true) {
  console.log(`${curDateD} sendEmail=${sendEmail}`);
  const curDate = moment(curDateD).startOf('day');
  const scheduleData = await sheet.readSheet('1xBcIUhWFKQYYgWWFRK6oBi3uTvumJNYbWWPz_ROiwPo', `'Schedule'!A:I`).then(r => {
    return r.data.values.map(d => {
      const dateStr = d[0];
      if (!dateStr.match(/^\d\d-\d\d$/)) return;
      const date = moment(`${dateStr}`, 'MM-DD');
      if (!date.isValid()) return null;
      const ret = ['A', 'B', 'F', 'G', 'I'].reduce((acc, who) => { 
        const pos = addrToPos(who);
        acc[pos] = d[pos];
        return acc;
      }, {
        date: moment(d[0], 'MM-DD'),
        //time: d[1],
        //location: d[5],
        //who: d[6],
        //what: d[8],
      });
      if (ret[addrToPos('B')] !== '7:30-9:30pm') return null;
      return ret;
    }).filter(x => x);
  });

  const found = scheduleData.reduce((acc, d) => {
    if (acc) return acc;
    if (d.date.isSameOrAfter(curDate)) return d;
  }, null);
  if (found) {
    found.diff = found.date.diff((curDate), 'days');
    found.date = found.date.format('YYYY-MM-DD');    
  }
  //console.log(found);  

  const message = {
    from: '"HebrewsBot" <gzhangx@gmail.com>',
    //to: 'hebrewsofacccn@googlegroups.com',  //nodemailer settings, not used here
    to: 'gzhangx@hotmail.com,yyz2005@hotmail.com',
    subject: 'NA',
    text: 'NA',
  };
  const template = await getTemplateData(curDateD);
  message.to = template.toAddrs.join(',');
  const messageData = createMessage2021(template, found, found.diff < 7 ? 'have' : 'havenot');
  Object.assign(message, messageData);
  console.log(message.to);
  console.log(message.subject);
  console.log(message.text);  
  
  if (!sendEmail) return message;
  email.sendGmail(message);
  return message;
}
module.exports = {
  checkSheetNotice,
  initSheetData,
    test,
};
