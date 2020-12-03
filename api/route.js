const keys = require('lodash/keys');
const sender = require('./controllers/sender');
const localMission = require('./controllers/localmission');

function addCORS(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
}

const getRoutes = ()=> ({
    '/sendToday': {
        method: 'get',
        func: sender.sender,
        schedule: '1 0 * * *',
    },
    '/sendHebrewsWeeklyEmail' : {
        method: 'get',
        func: sender.sendHebrewsWeeklyEmail,
        schedule: '0 8 * * 2,5',
    },
    '/testHebrewWeekelyEmail': {
        method: 'get',
        func: sender.testHebrewWeekelyEmail,
    },
    '/sendSantury' : {
        method: 'get',
        func: sender.sendSantury,
        schedule: '0 0 15,28 * *',
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
        func: sender.checkChannel,
        schedule: '0/5 9-12 * * 0',
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
    '/getSheetAuthUrl': {
        method: 'get',
        func: sender.getSheetAuthUrl
    },
    '/authorizeWithCode': {
        method: 'get',
        func: sender.authorizeWithCode
    },
    '/localMission/getCategory': {
        method: 'get',
        func: localMission.getLmCategories,
    },
    '/localMission/emailExpense': {
        method: 'post',
        func: localMission.emailExpense,
    },
    '/': {
        method: 'get',
        func: sender.version
    }
});

module.exports={
    getRoutes,
    route: (server, restify) => {
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
        
        const routes = getRoutes();
        const rts = keys(routes);
        rts.forEach(url=>{
            const op = routes[url];
            server[op.method](url, op.func);
        });        

        server.get('/build/*', restify.plugins.serveStatic({
            directory: __dirname+'/../public/local-mission-web/'
        }));
    }
};