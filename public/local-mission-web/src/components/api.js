//import { get } from 'superagent';

const apiBase = 'http://192.168.1.40:8080';
//const apiBase='http://localhost:8080';
const getUrl=path => `${apiBase}/localMission/${path}`;
const request = require('superagent');
const get = require('lodash/get');


function doGetOp(url) {
    return request.get(url).send().then(r => get(r, 'body'));
}
function doPostOp(url, data) {
    return request.post(url).send(data).then(r => get(r, 'body'));
}
 
export async function getData(sql) {
    return doGetOp(getUrl(sql));
}

export async function getCategories() {
    return getData('getCategory');
}

export async function emailExpense(data) {
    return doPostOp(getUrl('emailExpense'), data);
}

/*
module.exports = {
    getData,
    getModel,
    sqlGet,
    sqlAdd,
    sqlDelete,
    sqlGetTables,
    sqlGetTableInfo,
    sqlFreeForm,
    sendEmail,
};
*/
