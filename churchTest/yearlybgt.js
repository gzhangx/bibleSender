const sheet=require('../lib/getSheet').createSheet();
const fs=require('fs');
const moment=require('moment');
const { SSL_OP_NETSCAPE_CA_DN_BUG }=require('constants');
const ids=JSON.parse(fs.readFileSync('sec.json'));

const toField=str => str.charCodeAt(0)-'A'.charCodeAt(0);
async function getChurchData(myData) {
    const sheetId=ids.churchBudgetId;
    const dt=await sheet.readSheet(sheetId, `'2021 Budget'!A:P`);
    //console.log(dt.data.values);
    const budgetData=dt.data.values.reduce((acc, line, curInd) => {
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
                    curInd,
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

    const updateRanges=budgetData.reduce((acc, itm) => {
        const myItem=myData.sum[itm.expCode];
        if (myItem) {
            myItem.found=true;
            console.log(`${itm.expCode.padEnd(10)} church=${itm.amount.toFixed(2).padStart(10)} me=${myItem.amount.toFixed(2).padStart(10)} ${itm.description}`);
            if (acc.min>itm.curInd) acc.min=itm.curInd;
            if (acc.max<itm.curInd) acc.max=itm.curInd;
        }
        return acc;
    }, {
        min: 9999,
        max: 0,
    });

    myData.order.forEach(name => {
        const itm=myData.sum[name];
        if (!itm.found) {
            console.log(`!!!!!! NOT FOUND ${itm.expCode.padEnd(10)} ${itm.amount.toFixed(2).padStart(10)} ${itm.description}`);
        }
    });


    console.log("writting to church-------------------");
    console.log(updateRanges);
    const updateItemsCnt=updateRanges.max-updateRanges.min+1;
    const updateData=budgetData.reduce((acc, itm) => {
        const myItem=myData.sum[itm.expCode];
        const ind=itm.curInd-updateRanges.min;
        if (myItem) {
            console.log(`${itm.curInd} ${itm.expCode.padEnd(10)} church=${itm.amount.toFixed(2).padStart(10)} me=${myItem.amount.toFixed(2).padStart(10)} ${itm.description}`);
            acc[ind]=['', ''];
            if (itm.amount!==myItem.amount) {
                acc[ind][0]=`Amount Diff ${myItem.amount.toFixed(2)}`;
            } else {
                acc[ind][0]=myItem.amount;
            }
            acc[ind][1]=myItem.history;
        } else {
            if (ind>=0&&ind<updateItemsCnt) {
                acc[ind]=[``, ''];
            }
        }
        return acc;
    }, new Array(updateItemsCnt));
    console.log(updateData);
    await sheet.updateSheet(sheetId, `'2021 Budget'!I${updateRanges.min+1}:J${updateRanges.max+1}`, updateData);
}


async function getMyData() {
    const dt=await sheet.readSheet(ids.myBugetId, `'Sheet1'!A:I`);
    const localData=dt.data.values.reduce((acc, line) => {
        const subCode=line[toField('C')];
        const description=line[toField('E')];
        const expCode=line[toField('D')];
        const amount=parseFloat(line[toField('B')]);
        const date=moment(line[toField('A')]).toDate();
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
        const curHist=() => `${moment(itm.date).format('MM/DD')}:$${itm.amount}`;
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