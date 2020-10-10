const sheet=require('../lib/getSheet');
const fs=require('fs');
const ids=JSON.parse(fs.readFileSync('sec.json'));

const toField=str => str.charCodeAt(0)-'A'.charCodeAt(0);
async function getChurchData() {
    const sheetId=ids.churchBudgetId;
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


async function getMyData() {
    const dt=await sheet.createSheet().readSheet(ids.myBugetId, `'Sheet1'!A:I`);
    const localData=dt.data.values.reduce((acc, line) => {
        const subCode=line[toField('C')];
        const description=line[toField('E')];
        const expCode=line[toField('D')];
        const amount=parseFloat(line[toField('B')]);
        const date=line[toField('A')];
        acc.push({
            subCode,
            description,
            expCode,
            amount,
            date,
        });
        return acc;
    }, []).slice(1);


    const sumed=localData.reduce((acc, itm) => {
        const found=acc.sum[itm.expCode];
        const curHist=() => `${itm.date}:${itm.amount}`;
        if (!found) {
            acc.sum[itm.expCode]=
                { ...itm, history: curHist() };
            acc.order.push(itm.expCode);
        } else {
            found.amount+=itm.amount;
            found.history=`${found.history} ${curHist()}`;
        }
        return acc;
    }, {
        order: [],
        sum: {},
    });
    //console.log(sumed);

    sumed.order.forEach(name => {
        const itm=sumed.sum[name];
        console.log(`${itm.expCode.padEnd(10)} ${itm.amount.toFixed(2).padStart(10)} ${itm.description} ${itm.history}`);
    })
}

async function test() {
    await getMyData();
    console.log('---------------------');
    await getChurchData();
}

test();