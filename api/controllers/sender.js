const getd = require('../../lib/getdata');
function sender(req, res) {
    return getd.sendEmail().then(ok=>{
        res.send(ok);
    }).catch(err=>{
        res.send(err);
    });
}


function showWeek(req, res) {
    const {week, subject} = getd.getWeek();
    const r = week.slice(1).map(wk=> {
        const bold = wk === subject;
        const dsp = bold?`<b>${wk}</b>`:wk;
        return `${dsp}`;
    }).join('<br>');
    res.header('content-type','text/html; charSet=utf-8');
    res.sendRaw(r);
}

module.exports = {
    sender,
    showWeek,
};