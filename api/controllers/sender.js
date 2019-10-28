const getd = require('../../lib/getdata');
const getNotice = require('../../lib/getNotice');
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

function sendSheetNotice(req, res) {
    console.log(`sending sheet ${new Date()}`);
    return getNotice.checkSheetNotice().then(ok=>{
        res.send(ok);
    }).catch(err=>{
        res.send(err);
    });
}

module.exports = {
    sender,
    showWeek,
    sendSheetNotice,
};