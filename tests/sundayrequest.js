const acccn = require('../lib/youtubeacccn');


function scheduledAt5() {
    const coeff = 1000 * 60 * 5;
    const date = new Date();  //or use any other date
    const rounded = new Date(Math.round(date.getTime() / coeff) * coeff + coeff);
    const wait = rounded - date.getTime();
    console.log(`waiting ${wait / 1000}`);
    setTimeout(doSundayVideoRequestEvery5Min, wait);
}
async function doSundayVideoRequestEvery5Min() {    
    acccn.recordAcccnYoutubeCntAll().then(res => {
        console.log(res);
    }).catch(err => {
        console.log(err);
    }).then(() => {
        scheduledAt5();
    });
}

acccn.recordAcccnYoutubeCntAll();
scheduledAt5();