const gs = require('./getSheet');

async function getOps() {    
    const ops = await gs.getSheetOps('1uYTYzwjUN8tFpeejHtiGA5u_RtOoSBO8P1b2Qg-6Elk');
    return ops;    
}

module.exports = {
    getOps,
    readValues: range => getOps().then(ops => ops.read(range).then(r=>r.values)),
}