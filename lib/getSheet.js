const gapi = require('@gzhangx/googleapi');
const credentials=require('../credentials.json');
async function getSheetOps(sheetId) {
  const cli = await gapi.getClient(credentials.googleSheet.bibleSender2022);
  return cli.getSheetOps(sheetId);
}


module.exports = {
  getSheetOps,
}
/*
const fs = require('fs');
const {get,set}=require('lodash');
const googleSheet=require('./googleSheet');
const credentials=require('../credentials.json');

function stdGetSaveToken(credentialRepo, userName,token) {
  const path=['googleSheet', userName];
  const existing=get(credentialRepo,path);
  if(existing) return existing;
  if(!token) return null;
  set(credentialRepo,path,token);
  fs.writeFileSync('credentials.json',JSON.stringify(credentialRepo));
  return token;
}

const createSheetBase=googleSheet.createSheetBase;

module.exports={
  createSheetBase,
  createSheet: () => {    
    const gc=credentials.googleSheet.installed
    return createSheetBase(gc, 'ggtoken',
      userName => stdGetSaveToken(credentials,userName),
      (userName,token) => stdGetSaveToken(credentials,userName,token),
    );
  } 
};

*/