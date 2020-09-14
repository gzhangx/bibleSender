const acccn = require('../lib/youtubeacccn');

function getHourMin(h, m) {
    return h * 60 + m;
}
const STARTHOUR = getHourMin(9, 45);
const ENDHOUR = getHourMin(11, 15);
function scheduledAt5() {
    const coeff = 1000 * 60 * 5;
    const date = new Date();  //or use any other date
    const curTime = date.getTime();
    const curHourMin = getHourMin(date.getHours(), date.getMinutes());
    const rounded = new Date(Math.round(curTime / coeff) * coeff + coeff);
    const wait = rounded - curTime;
    
    
    if (curHourMin < STARTHOUR) {
        console.log(`waiting ${wait / 1000}, not started yet`);
        return setTimeout(scheduledAt5, wait);    
    } else if (curHourMin > ENDHOUR) {
        console.log('all done');
    }
    console.log(`waiting ${wait / 1000} and record`);
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

scheduledAt5();