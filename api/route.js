const keys = require('lodash/keys');
const sender = require('./controllers/sender');

function addCORS(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
}

const routes = {
    '/sendToday': {
        method: 'get',
        func: sender.sender
    },
    '/sendHebrewsWeeklyEmail' : {
        method: 'get',
        func: sender.sendHebrewsWeeklyEmail,
    },
    '/sendSantury' : {
        method: 'get',
        func: sender.sendSantury,
    },
    '/showWeek': {
        method: 'get',
        func: sender.showWeek
    },
    '/checkVideo': {
        method: 'get',
        func: sender.checkVideo
    },
    '/checkChannel': {
        method: 'get',
        func: sender.checkChannel
    },
    '/saveFunTypingRecord': {
        method: 'post',
        func: sender.saveFunTypingRecord,
    },
    '/sendGJEmails': {
        method: 'post',
        func: sender.sendGJEmails,
    },
    '/version': {
        method: 'get',
        func: sender.version
    },
    '/': {
        method: 'get',
        func: sender.version
    }
};

module.exports = {
    route: server => {
        server.opts("/*", function (req, res, next) {
            addCORS(req, res);
            res.send(200);
            return next();
        });
        server.use((req, res, next) => {
            if (req.method !== 'GET' && req.method !== 'POST') return next();
            addCORS(req, res);
            const controller = routes[req.url];
            if (controller && controller.auth) {
                if (!req.user) {
                    res.send(401, 'Unauthorized');
                    return next(false);
                }
            }
            return next();
        }); 
        
        const rts = keys(routes);
        rts.forEach(url=>{
            const op = routes[url];
            server[op.method](url, op.func);
        });        
    }
};