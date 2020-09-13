const routs=require('../api/route');
const keys=require('lodash/keys');

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
    return `${r.schedule} ${nodeName} ${programDir}/tests/execCron.js ${name} > ${logsDir}/${name}.log`;
})).map(s => `echo "${s}"; `).join('');
console.log(`(${allCronStr}) | crontab - `);
