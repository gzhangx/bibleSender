const keys = require('lodash/keys');
const sender = require('./controllers/sender');
const routes = {
    '/sendToday': {
        method: 'get',
        func: sender.sender
    },
    '/sendSheet' : {
        method: 'get',
        func: sender.sendSheetNotice,
    },
    '/sendSantury' : {
        method: 'get',
        func: sender.sendSantury,
    },
    '/showWeek': {
        method: 'get',
        func: sender.showWeek
    },
    '/version': {
        method: 'get',
        func: sender.version
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