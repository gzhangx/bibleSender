
const { submitFile } = require('../lib/localMissionFile');
function safeHouse() {
    submitFile({
        payeeName: 'Lian',
        reimbursementCat: '1604A',
        amount: 500,
        description: 'fake desc',
    });
}

function access() {
    submitFile({
        payeeName: 'Rebekah Wang',
        reimbursementCat: 'Organization support',
        amount: '3500',
        description: '05 Organization Support(Access Support) 1604 $3,500',
    });
}

access();