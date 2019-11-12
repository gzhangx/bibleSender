const getd = require('../../lib/getdata');
const sendHebrewsWeeklyEmailLib = require('../../lib/sendHebrewsWeeklyEmail');
const sendSanturyReminder = require('../../lib/sendSanturyReminder');
const ver = require('../../version');
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

function version(req, res) {
    const date = new Date();
    console.log(`version ${date}`);
    return res.send(ver);    
}

module.exports = {
    sender,
    showWeek,
    sendHebrewsWeeklyEmail,
    sendSantury,
    version,
};