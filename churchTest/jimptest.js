
const { submitFile } = require('../lib/localMissionFile');
submitFile({
    payeeName: 'Lian',
    reimbursementCat: '1604A',
    amount: 500,
    description: 'fake desc',
});