const axios = require('axios').default;
const get = require('lodash/get');
const pick = require('lodash/pick');
const mapValues = require('lodash/mapValues');
const credentials = require('../credentials.json');

function parseVal(v) {
    try {
        const iv = parseInt(v);
        if (iv.toString() === v) return iv;
    } catch {}
    try {
        return new Date(v).toISOString();
    } catch {}    
    return v;
}
function getGoogleLiveApiView(id, key=credentials.youtubeKey) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${id}&key=${key}`;
    return axios.get(url).then(axres => {
        const res = axres.data;
        const picked = pick(get(res,'items.0.liveStreamingDetails'),['actualStartTime','concurrentViewers']);
        const desc = pick(get(res,'items.0.snippet'),['channelTitle','title','description']);
        return Object.assign(desc,mapValues(picked, parseVal));
    });
}

function getYoutubeViewsByChannel(channelId, key=credentials.youtubeKey) {
    const url = `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet,id&key=${key}&order=date&maxResults=20&eventType=live&type=video`;
    return axios.get(url).then(axres => {
        const res = axres.data;
        const id = get(res,'items.0.id.videoId');
        const ret = pick(get(res,'items.0.snippet'),['title','description','publishedAt']);
        ret.id = id;
        console.log(JSON.stringify(ret,null,2));
        return ret;
    });
}


module.exports = {
    getGoogleLiveApiView,
    getYoutubeViewsByChannel,
}