//const Jimp = require('jimp');
const JSZip = require("jszip");
const { promisify } = require('util');
//const jimpRead = promisify(Jimp.read);
const moment = require('moment-timezone');
const email = require('./nodemailer');
const fs = require('fs');
//const { fstat } = require('fs');
const { appendSheet } = require('./getSheet').createSheet();

function getCategories() {
    return `1	1600	Chinese New Year Carnival
2	1602	Ministry (Music Events, Guest Speaker)
3	1603	EE Training
5	1604	Organization support
4	1604A	Local Community Outreach Activity
6	1604	Family Keepers
6	1604	Family ministry Seminars (2)
6	1604	Herald Monthly
6	1604	美國華福總幹事 General Secretary, CCCOW
6	1605	Annual Budget Contribute to SECCC Pool of F
7	1607	Local Medias (Xin Times)
10	1612	In Town 信望愛 students and scholars Ministr
11	1611	(福音營)Gospel Camp financial aid`.split('\n').map((l, ind) => {
        const parts = l.split('\t');
        return {
            subCode: parts[0],
            expCode: parts[1],
            name: parts[2],
        }
    });
}

async function generateXlsx(xlsxFileName, replaces) {
    const zip = new JSZip();

    const z = await zip.loadAsync(fs.readFileSync('./files/ExpenseTemplate.xlsx'));
    //console.log(z.files);
    const sheet1Name = 'xl/worksheets/sheet1.xml';
    const sheet1Data = await z.file(sheet1Name).async('string');
    //console.log(sheet1Data);
    //zip.remove(sheet1Name);
    //<c r="J34" s="44"><v>660</v></c></row >
    const data = replaces.reduce((acc, rpl) => {
        const { row, amount, column } = rpl;
        //const row = 35;
        //const amount = '___________test___________'
        //const column = 'B';
        console.log('before ' + acc.substr(acc.indexOf(`<c r="${column}${row}`), 40));
        const r1 = new RegExp(`<c r="${column}${row}" s="44"/>`);
        const r2 = new RegExp(`<c r="${column}${row}"([ ]*[s|t]="[0-9s]+"[ ]*)*><v>([0-9]+)?</v></c>`);

        const replaceTo = `<c r="${column}${row}" s="44"><v>${amount}</v></c>`;
        acc = acc.replace(r1, replaceTo).replace(r2, replaceTo);
        console.log(acc.substr(acc.indexOf(`<c r="${column}${row}`), 40));
        return acc;
    }, sheet1Data);
        
    //console.log(data + " " + data.indexOf(`<c r="J${row}`) + " " + `<c r="J${row}`)    
    zip.file(sheet1Name, data)
    const genb64 = await zip.generateAsync({ type: 'base64' });
    fs.writeFileSync(xlsxFileName, Buffer.from(genb64, 'base64'))
}

async function submitFile({
    payeeName,
    reimbursementCat,
    amount,
    submittedBy,
    description,
    attachements,
    ccList,
}) {    
    // const fnt = await Jimp.loadFont(Jimp.FONT_SANS_12_BLACK);
    // const AMTX = 1220;
    // const AMTYSTART = 670;
    // const AMTYEND = 977;
    const AMTCATS = getCategories();
    //console.log(AMTCATS);

    const { found, row } = AMTCATS.reduce((acc, cat, pos) => {
        if (!acc.found) {
            if (cat.expCode === reimbursementCat || cat.name === reimbursementCat) {
                acc.found = cat;
                acc.row = pos + 25;
            }
        }
        return acc;
    }, {});
    if (!found) {
        const err = { message: `not found ${reimbursementCat} ${pos}` };
        console.log(err.message);
        return err;
    }
    
    const today = moment().format('YYYY-MM-DD');
    // console.log(`amtPos=${amtPos} ${today}`);
    // const img = await jimpRead('./files/expenseVoucher.PNG');
    const useDesc = description || found.name;
    // img.print(fnt, 272, 161, payeeName)
    //     .print(fnt, AMTX, amtPos, amount)
    //     .print(fnt, 1227, 1351, amount)
    //     .print(fnt, 1227, 1351, amount)
    //     .print(fnt, 232, 1517, 'Gang Zhang')
    //     .print(fnt, 790, 1517, today)
    //     .print(fnt, 232, 1583, submittedBy || payeeName)
    //     .print(fnt, 790, 1583, today)
    //     .print(fnt, 222, 1455, useDesc)
    //     .quality(60) // set JPEG quality
    //     //.greyscale() // set greyscale
    //     .write('./temp/accchForm.jpg'); // save
    
    const YYYY = moment().format('YYYY');
    await appendSheet('11CBGDBgSCBnGoSWA0-ro4e5oDe0q7h31TEgHKCmlIWE', `'LM${YYYY}'!A1`,
        [[today, amount, found.subCode, found.expCode, useDesc, payeeName, today]]);
    
    const xlsxFileName = './temp/accchForm.xlsx';


    await generateXlsx(xlsxFileName, [
        { row, amount, column: 'J' },
        { row: 49, amount, column:'J'}
    ])
    const convertAttachement = orig => {
        const origB64 = orig.buffer;
        const indPos = origB64.indexOf(',');
        const b64 = indPos >= 0 ? origB64.slice(indPos + 1) : origB64;
        //data:image/jpeg;base64,
        const matched = origB64.match(/data:(.+);base64,/);
        let contentType;
        if (matched) {
            contentType = matched[1]
        }
        console.log(orig.name+ " " + contentType);
        console.log(b64.slice(0, 20));
        //require('fs').writeFileSync('temp/test.jpg', Buffer.from(b64,'base64'))
        return {
            fileName: orig.name,
            content: Buffer.from(b64,'base64'),
            contentType,
        }
    }
    const message = {
        from: '"LocalMissionBot" <gzhangx@gmail.com>',
        //to: 'hebrewsofacccn@googlegroups.com',  //nodemailer settings, not used here
        to: ['gzhangx@hotmail.com'].concat(ccList||[]),
        subject: `From ${payeeName} for ${found.name} Amount ${amount}`,
        text: `
        Date: ${today}
        subCode: ${found.subCode}
        expCode: ${found.expCode}
        amount: ${amount}
        payee: ${payeeName}
        `,
        attachments: [{
            fileName: 'expense.xlsx',
            path: xlsxFileName,
        }] //.concat(attachements.map(convertAttachement))
    };
    email.sendGmail(message);
}


module.exports = {
    getCategories,
    submitFile,
}