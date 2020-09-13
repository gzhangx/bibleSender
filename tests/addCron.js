const routs=require('../api/route');
const keys=require('lodash/keys');
const {spawn}=require("child_process");

const allRoutes=routs.getRoutes();
const allKeys=keys(allRoutes);
const hasScheduleKeyNames=allKeys.filter(k => allRoutes[k].schedule);

const nodeName='/usr/local/bin/node';
const homeDir='/home/pi';
const programDir=`${homeDir}/bibleSender`;
const logsDir=`${homeDir}/logs`;
const cronStart=`@reboot ${nodeName} ${programDir}/index.js > ${logsDir}/bs.log &`;
const allCronStr=[cronStart].concat(hasScheduleKeyNames.map(name => {
    const r=allRoutes[name];
    return `${r.schedule} ${nodeName} ${programDir}/tests/execCron.js ${name} > ${logsDir}/${name.replace('/','')}.log`;
}));

const execStr=`(${allCronStr}) | crontab - `;
console.log(execStr);

const crontab = spawn('crontab',['-l'],{
    stdio: ['pipe',process.stdout,process.steerr]
});



async function main() {
    
    for(let i=0; i<allCronStr.length; i++) {
        await crontab.stdin.write(allCronStr[i]);
    }
    console.log('### DONE');
}
main();