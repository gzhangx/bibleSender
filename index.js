const restify = require('restify');
const route = require('./api/route');

const server = restify.createServer();
route.route(server);
//for (let i = 0; i < 100;i++)
//console.log(getd.GetTodaysSearch(moment().add(i,'days')));
//console.log(getd.loadData());
//getd.SendEmail();

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
