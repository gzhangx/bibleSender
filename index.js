const restify = require('restify');
const route = require('./api/route');
const moment = require('moment-timezone');
const getd = require('./lib/getdata');

const server = restify.createServer();
route.route(server);

console.log(moment.tz('EST').format());
console.log(moment().format());
console.log(moment.tz('2018-01-01','EST').format());
console.log(moment('2018-01-01').format());

console.log(moment.tz('EST').diff(moment.tz('2018-07-05','EST'), 'days'));
console.log(getd.GetTodaysSearch());
console.log(getd.loadData());
getd.SendEmail();
return;
server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
