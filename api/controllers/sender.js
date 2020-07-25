const get = require('lodash/get');
const getd = require('../../lib/getdata');
const sendHebrewsWeeklyEmailLib = require('../../lib/sendHebrewsWeeklyEmail');
const sendSanturyReminder = require('../../lib/sendSanturyReminder');
const acccn = require('../../lib/youtubeacccn');
const ver = require('../../version');
const { appendSheet } = require('../../lib/getSheet');
function sender(req, res) {
	console.log(`sending daily email ${new Date()}`);
    return getd.sendEmail().then(ok=>{
        res.send(ok);
    }).catch(err=>{
        res.send(err);
    });
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
    }).catch(err=>{
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
    return acccn.recordAcccnVideoViewCountByChannel(id).then(async ret=>{
        const maxInf = await acccn.getAndSetAcccnAttendenceNumber(ret.count);
        res.send(Object.assign(ret, maxInf));
    }).catch(err=>{
        handleErr(res,err);
    })
}

function saveFunTypingRecord(req, res) {
    if (!req.body) {
        return res.send({ err: "no body" });    
    }
    const { name, username, wpm } = req.body;
    if (!name) {
        return res.send({ err: "no name" });    
    }
    if (!username) {
        return res.send({ err: "no username" });
    }
    return appendSheet('1fcSgz1vEh5I3NS5VXCx1BHitD_AAQrmUCXNJPPSyDYk', `'Sheet1'!A1`, [[new Date(), username, name, wpm]]).then(resok => {
        res.send({ ok: resok });
    }).catch(exc => {
        return res.send(exc);  
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
    sendSantury,
    saveFunTypingRecord,
    version,
};