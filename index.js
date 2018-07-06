const restify = require('restify');
const route = require('./api/route');

const server = restify.createServer();
route.route(server);


server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
