const routs=require('../api/route');
const keys=require('lodash/keys');
const {exec}=require("child_process");

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
})).map(s => `echo "${s}"; `).join('');

const execStr=`(${allCronStr}) | crontab - `;
console.log(execStr);

exec(execStr,(error,stdout,stderr) => {
    if(error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if(stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(stdout);
});