'use strict';

const fs = require('fs');
const moment = require('moment-timezone');
const mailgun = require('./mailgun');
const schedule = require('./schedule');
const dailyparts = require('./dailyparts');

function ParseLineData(data) {
    const lineData = [];
    for (let i = 0; i < 8; i++) lineData[i] = '';
    let who = 0;
    let prevChar = ' ';
    for (let i = 0; i < data.length; i++) {
        const d = data[i];
        if (who < lineData.length) lineData[who] = d;
        if (who > 0) {
            const c = d[0];
            if (c >= '0' && c <= '9') {
                lineData[who - 1] += d;
                continue;
            }
            if (c === ',') {
                lineData[who - 1] += c;
                prevChar = c;
                continue;
            }
            if (prevChar === ',') {
                lineData[who - 1] += c;
            }
            prevChar = c;
        }
        who++;
    }
    return lineData;
}

function ScheduleToJson(){
    const data = fs.readFileSync('./lib/schedule.txt', 'utf8', function (err) {
        if (err) console.log('schedule.txt error ' + err);
    });
    const lines = data.split('\n');
    const startDate = moment.tz(lines[0].trim(),'EST').format('YYYY-MM-DD');
    const res = {startDate, schedule:[], verses: {}};
    let pos = 0;
    for (let i = 1; i < lines.length; i++) {
        const curLine = lines[i];
        const lineData = ParseLineData(curLine.split(/[\s\t]+/));
        res.schedule.push(lineData);
        console.log('reading line '+ i + ' of ' + lines.length+ ' ' + curLine);
        for (let li in lineData) {
            if (parseInt(li) === 0) continue;
            res.verses[lineData[li]] = { pos: pos++};
        }
    }

    const fcnt = JSON.stringify(res);
    fs.writeFileSync('schedule.json', fcnt);
}

function init_createAllData() {


    const bibleData = fs.readFileSync('./lib/bibleUTF8.txt', 'utf8', function (err) {
        if (err) console.log('bibleutf error ' + err);
    }).split('\n');

    const res = {};
    for (let i = 0; i < 800; i++) {
        const searches = GetTodaysSearch(moment().add(i, 'days'));
        const data = GetOutput(bibleData, searches.Verses);
        const ret = {
            subject: searches.Subject.trim().replace(/ /g, ''),
            data
        };
        console.log(ret);
        res[searches.days] = ret;
    }
    fs.writeFileSync('dailyparts.json', JSON.stringify(res));
}

function getTodayEST() {
    return moment.tz('EST');
}
function getDaysOffset(today) {
    if (!today) today = getTodayEST();
    today.add(2, 'hours'); //for dst
    return today.diff(moment.tz(schedule.startDate,'EST'), 'days')%728;
}

function getWeek(today) {
    const DAYS_PER_LINE = 7;
    const lines = schedule.schedule;
    const days = getDaysOffset(today);
    const curLineDay = Math.floor(days / DAYS_PER_LINE);
    const lineData = lines[curLineDay];
    const day = days % DAYS_PER_LINE;
    const curdata1 = lineData[day + 1];
    return {
        days,
        week: lineData,
        day,
        subject: curdata1
    }
}

function GetTodaysSearch(today) {
    const week = getWeek(today);

    const retResult = {
        days: week.days,
        Verses: []
    };
    const results = retResult.Verses;

    retResult.subject = week.subject;
    const curdataparts = week.subject.split(/[,]+/);

    for (let curdataii in curdataparts) {
        const curdata = curdataparts[curdataii];
        let numStart = 0;
        for (; numStart < curdata.length; numStart++) {
            if (!isNaN(curdata[numStart])) {
                break;
            }
        }
        const bookName = curdata.substring(0, numStart);

        let numbers = curdata.substring(numStart);

        //formats: book#-#
        //         book#:#-#
        //         book #(#/#)
        if (numbers.indexOf(":") > 0) {
            const verse = numbers.substring(0, numbers.indexOf(":"));
            numbers = numbers.substring(numbers.indexOf(":") + 1);
            if (numbers.indexOf("-") > 0) {
                const numberary = numbers.split('-');
                const fromVer = parseInt(numberary[0]);
                let toVer = parseInt(numberary[1]);
                for (let num = fromVer; num <= toVer; num++) {
                    results.push({Verse: bookName + verse + ":" + num + " "});
                }
            }
            else {
                results.push({Verse: curdata});
            }

        } else if (numbers.indexOf("-") > 0) {
            const numberary = numbers.split('-');
            const fromVer = parseInt(numberary[0]);
            const toVer = parseInt(numberary[1]);
            for (let num = fromVer; num <= toVer; num++) {
                results.push({Verse: bookName + num});
            }
        }
        else if (numbers.indexOf("(") > 0) {
            const chapterN = numbers.indexOf("(");
            const pt =
                {
                    Verse: bookName + numbers.substring(0, chapterN)
                };
            const partialStr = numbers.substring(numbers.indexOf("("));
            const startNTotal = partialStr.split(/[\(/\)]/);
            pt.Part = parseInt(startNTotal[0]);
            pt.Total = parseInt(startNTotal[1]);
            results.push(pt);
        }
        else {
            results.push({Verse: curdata});
        }
    }

    for (const rii in results) {
        const r = results[rii];
        if (r.Verse.indexOf(":") >= 0) continue;
        const lastChar = r.Verse[r.Verse.length - 1];
        if (lastChar >= '0' && lastChar <= '9')
            r.Verse += ":";
    }
    return retResult;
}


function GetOutput(all, shows) {
    let sb = '';
    for (let showi in shows) {
        const show = shows[showi];
        const result = [];
        for (let ti in all) {
            const t = all[ti];
            if (t.startsWith(show.Verse)) {
                result.push(t);
            }
        }
        let startLimit = 0;
        let endLimit = result.length;
        if (show.Part !== 0) {
            startLimit = (show.Part - 1) * result.length / show.Total;
            endLimit = (show.Part) * result.length / show.Total;
            if (show.Part === result.length) endLimit++;
        }
        for (let i = 0; i < result.length; i++) {
            if (i < startLimit) continue;
            if (i >= endLimit) continue;
            const t = result[i];
            sb += (t) + ("\r\n");
        }
    }
    return sb;
}

function loadData(today) {

    const days = getDaysOffset(today);
    return dailyparts[days];
    //
    // const searches = GetTodaysSearch(today);
    // if (searches === null) return null;
    //
    // const bibleData = fs.readFileSync('./lib/bibleUTF8.txt', 'utf8', function (err) {
    //     if (err) console.log('bibleutf error ' + err);
    // }).split('\n');
    //
    // const ret = {};
    // const data = GetOutput(bibleData, searches.Verses);
    // if (searches.Subject === null) return null;
    // ret.SubjectTag = searches.Subject.trim().replace(/ /g,'');
    // //var simpSub = TongWen.trans2Simp(searches.Subject);
    // //if (simpSub == searches.Subject) {
    // //    ret.Subject = searches.Subject;
    // //}
    // //else {
    // //    ret.Subject = simpSub + ' (' + searches.Subject + ')';
    // //}
    //
    // ret.Data = data;
    // return ret;

}

//var resss = loadData(new Date());
//console.log(resss.Data);


function sendEmail(now)
{
    if (!now) now = getTodayEST();
    const data = loadData(now);
    const message = {};
    
    message.subject = data.subject + ', ' + now.format('YYYY-MM-DD');
    console.log('sending ' + message.subject);
    //message.BodyEncoding = System.Text.Encoding.UTF8;
    message.text = data.data;

    return mailgun.sendMailByMailGun(message);
}

//ScheduleToJson();
//init_createAllData();
/*
for (var i = 0; i < 1000; i++) {
    var now = new Date();
    now.setDate(now.getDate()+i);
    console.log(now+"\r\n");
    var data = loadData(now);
    console.log(data.Subject+"\r\n");
    console.log('data='+data.Data+"\r\n");
}
/* */
//for (let i = 0; i < 100;i++) {
//    console.log(getWeek(moment().add(i, 'days')));
//    console.log(SendEmail(moment().add(i, 'days')));
//    console.log(loadData(moment().add(i, 'days')).Data);
//}

//getd.SendEmail();

module.exports = {
    GetTodaysSearch,
    loadData,
    getWeek,
    sendEmail
};