const keys = require('lodash/keys');
const sender = require('./controllers/sender');
const routes = {
  '/getToday' : {
      method: 'get',
      func: sender.sender
  }
};

module.exports = {
    route: server=>{
        const rts = keys(routes);
        rts.forEach(url=>{
            const op = routes[url];
            server[op.method](url, op.func);
        });
    }
};