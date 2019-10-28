function sendMailByMailGun(message) {
    const api_key = 'key-b9cc4c7cfe07d033dd507d4b1c89e635';
    const domain = 'mail.veda-inc.com';
    const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

    const data = {
        from: 'gzhangx@gmail.com',
        to: [
            'hebrewsofacccn@googlegroups.com'
        ],
        subject: message.subject,
        text: message.text
    };
    return new Promise((resolve, reject) => {
        mailgun.messages().send(data, function (err, body) {
            if (err) {
                console.log('Oh noes: ' + err);
                return reject({
                    status: 'Error',
                    error: err.message
                });
            }
            else {
                return resolve(Object.assign({
                    status: 'OK',
                    message,
                }, body));
            }
        });
    });
}

module.exports = {
    sendMailByMailGun,
}