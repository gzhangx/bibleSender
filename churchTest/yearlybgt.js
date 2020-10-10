const sheet=require('../lib/getSheet');
const fs=require('fs');
const ids=JSON.parse(fs.readFileSync('sec.json'));

const toField=str => str.charCodeAt(0)-'A'.charCodeAt(0);
async function getChurchData(myData) {
    const sheetId=ids.churchBudgetId;
    const dt=await sheet.createSheet().readSheet(sheetId, `'2021 Budget'!A:P`);
    //console.log(dt.data.values);
    const budgetData=dt.data.values.reduce((acc, line) => {
        const subCode=line[toField('A')];
        const description=line[toField('B')];
        const expCode=line[toField('G')]||'';
        const amount=parseFloat(line[toField('H')]||'0');
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
    }).lines.slice(1);    

    budgetData.forEach(itm => {
        if (myData.sum[itm.expCode]) {
            myData.sum[itm.expCode].found=true;
            console.log(`${itm.expCode.padEnd(10)} ${itm.amount.toFixed(2).padStart(10)} ${itm.description}`);
        }
    });

    myData.order.forEach(name => {
        const itm=myData.sum[name];
        if (!itm.found) {
            console.log(`!!!!!! NOT FOUND ${itm.expCode.padEnd(10)} ${itm.amount.toFixed(2).padStart(10)} ${itm.description}`);
        }
    });
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
    });
    return sumed;
}

async function test() {
    const myData=await getMyData();
    console.log('---------------------');
    await getChurchData(myData);
}

test();