const sheet=require('../lib/getSheet');
const fs=require('fs');
const sheetId=JSON.parse(fs.readFileSync('sec.json')).bugetId;
const toField=str => str.charCodeAt(0)-'A'.charCodeAt(0);
async function getData() {
    const dt=await sheet.createSheet().readSheet(sheetId, `'2021 Budget'!A:P`);
    //console.log(dt.data.values);
    const localData=dt.data.values.reduce((acc, line) => {
        const subCode=line[toField('A')];
        const description=line[toField('B')];
        const expCode=line[toField('G')];
        const amount=line[toField('H')];
        if (!acc.start) {
            if (/Local Evangelism/.test(subCode)) {
                acc.start=true;
            }
        } else if (!acc.end) {
            if (subCode.trim()) {
                acc.lines.push({
                    subCode,
                    description,
                    expCode,
                    amount,
                });
            } else acc.end=true;
        }
        return acc;
    }, {
        start: false,
        end: false,
        lines: [],
    }).lines.slice(1).filter(x => x.amount).map(x => ({
        ...x,
        amount: parseFloat(x.amount),
    }));


    const sumed=localData.reduce((acc, itm) => {
        if (!acc.sum[itm.expCode]) {
            acc.sum[itm.expCode]=itm;
            acc.order.push(itm.expCode);
        } else {
            acc.sum[itm.expCode].amount+=itm.amount;
        }
        return acc;
    }, {
        order: [],
        sum: {},
    });
    //console.log(sumed);

    sumed.order.forEach(name => {
        const itm=sumed.sum[name];
        console.log(`${itm.expCode.padEnd(10)} ${itm.amount.toFixed(2).padStart(10)} ${itm.description}`);
    })
}

getData();
