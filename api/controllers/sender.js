const getd = require('../../lib/getdata');
function sender(req, res) {
    return getd.SendEmail().then(ok=>{
        res.send(ok);
    }).catch(err=>{
        res.send(err);
    });
}
module.exports = {
    sender
};