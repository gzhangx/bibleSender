const restify = require('restify');
const route = require('./api/route');

const server = restify.createServer();
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
route.route(server, restify);

const port = process.env.PORT || 8080;
server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
