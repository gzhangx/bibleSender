const get = require('lodash/get');
const lm = require('../../lib/localMissionFile');
const creds = require('../../credentials.json')
function getLmCategories(req, res) {    
    return res.send(lm.getCategories());    
}

function emailExpense(req, res) {
    const { amount, payee, categary, attachements, doCC } = req.body;
    console.log(`${amount} ${payee} ${categary}`);
    lm.submitFile({
        payeeName: payee,
        reimbursementCat: categary,
        amount: amount,
        description: `${payee} ${amount} ${categary}`,
        attachements,
        ccList: doCC ? creds.treasureEmails:[],
    }).then(() => {
        res.send({message: 'done'})
    })
}

module.exports = {
    getLmCategories,
    emailExpense,
};