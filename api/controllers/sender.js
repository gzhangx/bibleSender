const get = require('lodash/get');
const getd = require('../../lib/getdata');
const sendHebrewsWeeklyEmailLib = require('../../lib/sendHebrewsWeeklyEmail');
const sendSanturyReminder = require('../../lib/sendSanturyReminder');
const acccn = require('../../lib/youtubeacccn');
const ver = require('../../version');
const sheet = require('../../lib/getSheet').createSheet();
const mail = require('../../lib/nodemailer');
async function sender(req, res) {
    console.log(`sending daily email ${new Date()}`);
    let ok1 = null, ok2 = null;
    let err1 = null, err2 = null;
    try {
        ok1 = await getd.sendEmail();
        console.log(`First sent `);
        console.log(ok1);
    } catch (err) {
        err1 = err;
    }
    try {
        ok2 = await getd.sendEmail({
            //now: moment('2021-03-27'),
            scheduleFileName: './lib/scheduleJinlin.txt',
            from: '"JY Daily Bible verse test" <gzhangx@gmail.com>',
            to: 'gzhangx@hotmail.com,jinlinx@hotmail.com',
        });
        console.log(`second sent `);
        console.log(ok2);
    } catch (err) {
        err2 = err;
    }
    res.send({ ok1, ok2, err1, err2 });    
}


function showWeek(req, res) {
	console.log(`show weekly verse ${new Date()}`);
    const {week, subject} = getd.getWeek();
    const r = week.slice(1).map(wk=> {
        const bold = wk === subject;
        const dsp = bold?`<b>${wk}</b>`:wk;
        return `${dsp}`;
    }).join('<br>');
    res.header('content-type','text/html; charSet=utf-8');
    res.sendRaw(r);
}

function sendHebrewsWeeklyEmail(req, res) {
    console.log(`sending sendHebrewsWeeklyEmail ${new Date()}`);
    return sendHebrewsWeeklyEmailLib.checkSheetNotice().then(ok=>{
        res.send(ok);
    }).catch(err => {
        console.log(err);
        res.send(err);
    });
}

function testHebrewWeekelyEmail(req,res) {
    console.log(`test sending sendHebrewsWeeklyEmail ${new Date()}`);
    return sendHebrewsWeeklyEmailLib.checkSheetNotice(new Date(), false).then(ok => {
        res.send(ok);
    }).catch(err => {
        console.log(err);
        res.send(err);
    });
}

function sendSantury(req, res) {
    console.log(`sending santury ${new Date()}`);
    return sendSanturyReminder.checkSanturyNotice().then(ok=>{
        res.send(ok);
    }).catch(err=>{
        res.send(err);
    });
}

function handleErr(res, err) {
    const txt = get(err,'response.text');
    console.log(txt);
    res.send(txt);
}
function checkVideo(req, res) {
    console.log(`video id ${req.query.id}`);
    return acccn.recordAcccnVideoViewCount(req.query.id).then(async ret=>{
        const maxInf = await acccn.getAndSetAcccnAttendenceNumber(ret.count);
        res.send(Object.assign(ret, maxInf));
    }).catch(err=>{
        handleErr(res,err);
    });
}

function checkChannel(req, res) {
    const id = req.query.id || 'UCgoGuFymG8WrD_3dBEg3Lqw';
    console.log(`channel id ${id}`);
    return acccn.recordAcccnYoutubeCntAll(id).then(async ret=>{        
        res.send(ret);
    }).catch(err=>{
        handleErr(res,err);
    })
}

function saveFunTypingRecord(req, res) {
    if (!req.body) {
        return res.send({ err: "no body" });    
    }
    const { name, userName, wpm, wordCount, verseCount } = req.body;
    if (!name) {
        return res.send({ err: "no name" });    
    }
    if (!userName) {
        //return res.send({ err: "no userName" });
    }
    console.log(`save for ${userName} ${name} wpm=${wpm} wordCount=${wordCount} verseCount=${verseCount}`);
    const maskUsername = nm => {
        const parts = nm.split('@');
        parts[0] = parts[0].substr(0, 2) + '###';
        return parts.join('@');
    }
    return sheet.appendSheet('1fcSgz1vEh5I3NS5VXCx1BHitD_AAQrmUCXNJPPSyDYk', `'Sheet1'!A1`, [[new Date(), maskUsername(userName), name, wpm, wordCount, verseCount]]).then(resok => {
        res.send({ ok: resok });
    }).catch(exc => {
        return res.send(exc);  
    })    
}

function sendGJEmails(req, res) {
    if (!req.body) {
        return res.send({ err: "no body" });
    }
    const { subject, text } = req.body;
    if (!subject || !text) {
        return res.send({ err: "no subject or text" });
    }
    const to = ['funtyping@googlegroups.com','gzhangx@hotmail.com'];
    return mail.sendGmail({
        from: '"GGBot" <gzhangx@gmail.com>',
        to,
        subject,
        text
    }).then(inf => {
        return res.send({ message: "ok" });
    });
}

function getSheetAuthUrl(req, res) {
    const url = sheet.getSheetAuthUrl();
    res.send({ url });
}

function authorizeWithCode(req, res) {
    const code = req.query.code;
    console.log(`authorizeWithCode ${code}`);
    return sheet.authorizeWithCode(code).then(() => {
        res.send('done');
    }).catch(err => {
        res.send(err);
    })
}

function version(req, res) {
    const date = new Date();
    console.log(`version ${date}`);
    return res.send(ver);    
}

module.exports = {
    checkVideo,
    checkChannel,
    sender,
    showWeek,
    sendHebrewsWeeklyEmail,
    testHebrewWeekelyEmail,
    sendSantury,
    saveFunTypingRecord,
    sendGJEmails,
    getSheetAuthUrl,
    authorizeWithCode,
    version,
};