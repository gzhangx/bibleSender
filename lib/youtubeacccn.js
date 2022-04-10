const get = require('lodash/get');
const moment = require('moment-timezone');
const {getGoogleLiveApiView, getYoutubeViewsByChannel} = require('./youtubeutil');
//const { readSheet, readRanges, appendSheet, updateSheet } = require('./getSheet').createSheet();
//const gsDirect = require('./googleSheetDirect');
const gapi = require('@gzhangx/googleapi');
const credentials = require('../credentials.json');

const spreadsheetId = '1u_AR8y7iCRPGyDhdOb1cHhjL-vclCIxuLkMhIxd08mU';


async function recordAcccnVideoViewCount(id) {
    const YYYY = moment().format('YYYY');
    await createYYYYTab(YYYY, spreadsheetId);
    return getGoogleLiveApiView(id).then(async videoDetail=>{
        const concurrentViewers = videoDetail.concurrentViewers;
        console.log(`Current views for ${id} ${concurrentViewers}`);
        if (!concurrentViewers) return {
            error: `Not found concurrentViewers for ${id}`,
        };
        const ops = await getSheetOps(spreadsheetId);
        return ops.append(`'${YYYY}'!A1`,[[moment().tz('America/New_York').format(), concurrentViewers, id, videoDetail.channelTitle, videoDetail.title]]).then(appendres=>{
            //console.log(JSON.stringify(appendres,null,2));
            return ops.read(`'${YYYY}'!A:J`).then(res=>{
                //console.log(JSON.stringify(res.data.values,null,2));
                const appendRange = get(appendres,'updates.updatedRange');
                console.log(`====>Current views for ${id} ${videoDetail.channelTitle} ${videoDetail.title} ${concurrentViewers} ${appendRange}`);
                return {
                    count: concurrentViewers,
                    appendRange,
                }
            })
        })
    });
}

async function recordAcccnVideoViewCountByChannel(channel) {
    const res = await getYoutubeViewsByChannel(channel);
    if (!res.id) {
        return {
            error: 'No live vid in channel',
        }
    }
    return await recordAcccnVideoViewCount(res.id);
}

async function getSheetOps(sheetId) {
    const cli = await gapi.getClient(credentials.googleSheet.bibleSender2022);
    return cli.getSheetOps(sheetId);
}
async function createYYYYTab(YYYY, sheetId) {
    //const cli = await gsDirect.getClient('bibleSender2022');
    const sheetOps = await getSheetOps(sheetId);
    return sheetOps.addSheet(YYYY);
}
async function getAndSetAcccnAttendenceNumber(count, date) {
    const today = moment(date).startOf('day');
    const YYYY = today.format('YYYY');    
    const sheetOps = await getSheetOps(credentials.AcccnAttendenceSheetId);
    const curVal = await sheetOps.read(`'${YYYY}'!A:G`).then(res=>{
    const vals = res.values;
    const days = vals.map(d=>d[0]).map(d=>d?moment(d,'M/D/YYYY').startOf('day'):moment.invalid());
    for (let i = 0; i < days.length; i++) {
        if (days[i].isSame(today)){
            console.log(`is same on ${i} of ${today}`);
            return {
                ind: i+1,
                date: vals[i][0],
                val: get(vals,[i,6]) || 0,
            };            
        }
    }
    return {
        error: 'No date found'
    };
  }).catch(err=>{
      console.log(err.message);
      return {error: 'some error happened'};
  });

  if (!curVal) {
      const error = `Warning, curval not found for ${today}`;
    console.log(error);
    return {
        error,
    }
  }
  if (count > curVal.val) {
      console.log(`Replacing old val ${curVal.val} with new one ${count}`);
      await sheetOps.updateValues(`'${YYYY}'!G${curVal.ind}:G${curVal.ind}`, [[count]]);
      return {
          previousMax: curVal.val,
      }
  }
  return {
      maxCount: curVal.val,
  };
}

async function recordAcccnYoutubeCntAll(oid) {
    const id = oid || 'UCgoGuFymG8WrD_3dBEg3Lqw';
    console.log(`channel id ${id}`);
    return recordAcccnVideoViewCountByChannel(id).then(async ret => {
        const maxInf = await getAndSetAcccnAttendenceNumber(ret.count);
        return (Object.assign(ret, maxInf));
    });
}
module.exports = {
    recordAcccnVideoViewCount,
    recordAcccnVideoViewCountByChannel,
    getAndSetAcccnAttendenceNumber,
    recordAcccnYoutubeCntAll,
}