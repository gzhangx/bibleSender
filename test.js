var api_key = 'key-b9cc4c7cfe07d033dd507d4b1c89e635';
var domain = 'mail.veda-inc.com';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
 
var data = {
  from: 'gzhangx@hotmail.com',
  to: ['gzhangx@hotmail.com','gzhangx@hotmail.com'],
  subject: 'Hello',
  text: 'Testing some Mailgun awesomeness!'
};
 
mailgun.messages().send(data, function (error, body) {
  console.log(body);
});


return;
const t = require('./lib/getdata');
t.SendEmail().then(d=>{
console.log('done');
console.log(d);
}).catch(err=>{
  console.log(err);
});