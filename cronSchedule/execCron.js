const routes=require('../api/route').getRoutes();

const execName=process.argv[2];

const req={
    query: {}
};
const res={
    send: obj => {
        console.log(obj);
    }
}

console.log(`doning ${execName}`);
routes[execName].func(req,res);