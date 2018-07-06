'use strict';

var fs = require('fs');
const moment = require('moment-timezone');

Date.prototype.yyyymmdd = function () {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
    var dd = this.getDate().toString();
    return yyyy + '-'+(mm[1] ? mm : "0" + mm[0])+ '-' + (dd[1] ? dd : "0" + dd[0]); // padding
};



var ParseLineData = function(data)
      {
          var lineData = [];
	for (var i = 0; i < 8; i++) lineData[i] = '';
          var who = 0;
          var prevChar = ' ';
          for (var i = 0; i < data.length; i++)
          {
		var d = data[i];
              if (who < lineData.length) lineData[who] = d;
              if (who > 0)
              {
                  var c = d[0];
                  if (c >= '0' && c <= '9')
                  {
                      lineData[who - 1] += d;
                      continue;
                  }                 
                  if (c == ',')
                  {
                      lineData[who - 1] += c;
                      prevChar = c;
                      continue;
                  }
                  if (prevChar == ',')
                  {
                      lineData[who - 1] += c;
                  }
                  prevChar = c;
              }
              who++;
          }
          return lineData;
      };

var _MS_PER_DAY = 1000 * 60 * 60 * 24;
var _MS_PER_HALFDAY = _MS_PER_DAY/2;

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 + _MS_PER_HALFDAY - utc1) / _MS_PER_DAY);
}

function ScheduleToJson(){
    var data = fs.readFileSync('schedule.txt', 'utf8', function (err) {
        if (err) console.log('schedule.txt error ' + err);
    });
    var lines = data.split('\n');
    var startDate = new Date(Date.parse(toASCII(lines[0].substring(1)))+(12*3600*1000));
    var res = {startDate: {y: startDate.getFullYear(), m: startDate.getMonth(), d : startDate.getDate()}, schedule:[], verses: {}};
    var pos = 0;
    for (var i = 1; i < lines.length; i++) {
        var curLine = lines[i];
        var lineData = ParseLineData(curLine.split(/[\s\t]+/));
        res.schedule.push(lineData);
        console.log('reading line '+ i + ' of ' + lines.length+ ' ' + curLine);
        for (var li in lineData) {
            if (parseInt(li) === 0) continue;
            res.verses[lineData[li]] = { pos: pos++};
        }
    }

    var fcnt = JSON.stringify(res);
    fs.writeFileSync('schedule.json', fcnt);
}

function getEst(str) {
    return moment(str).tz('EST').format();
}

function getTodayEST() {
    return moment.tz('EST');
}
function getDaysOffset(startDateStr, today) {
    if (!today) today = getTodayEST();
    today.add(2, 'hours'); //for dst
    return today.diff(moment.tz(startDateStr,'EST'), 'days');
}
function GetTodaysSearch(today) {
    const data = fs.readFileSync('./lib/schedule.txt', 'utf8', function (err) {
        if (err) console.log('schedule.txt error ' + err);
    });
    const retResult = {
        Verses: []
    };
    const results = retResult.Verses;
    const lines = data.split('\n');

    const days = getDaysOffset(lines[0].trim(), today)%728;
    if (days < 0) return null;

    const DAYS_PER_LINE = 7;
    //for (var i = 0; i <= (days / DAYS_PER_LINE); i++)
    {
        //if (curLinePos >= lines.length) break;
        const curLineDay = Math.floor(days / DAYS_PER_LINE) + 1;
        const curLine = lines[curLineDay].trim();
        const day = days % DAYS_PER_LINE;
        const lineData = ParseLineData(curLine.split(/[\s\t]+/));
        const curdata1 = lineData[day + 1];
        retResult.Subject = curdata1;
        const curdataparts = curdata1.split(/[,]+/);

        for (let curdataii in curdataparts) {
            const curdata = curdataparts[curdataii];
            let numStart = 0;
            for (; numStart < curdata.length; numStart++) {
                if (!isNaN(curdata[numStart])) {
                    break;
                }
            }
            const bookName = curdata.substring(0, numStart);

            let numbers = curdata.substring(numStart);

            //formats: book#-#
            //         book#:#-#
            //         book #(#/#)
            if (numbers.indexOf(":") > 0) {
                const verse = numbers.substring(0, numbers.indexOf(":"));
                numbers = numbers.substring(numbers.indexOf(":") + 1);
                if (numbers.indexOf("-") > 0) {
                    const numberary = numbers.split('-');
                    const fromVer = parseInt(numberary[0]);
                    let toVer = parseInt(numberary[1]);
                    for (let num = fromVer; num <= toVer; num++) {
                        results.push({ Verse: bookName + verse + ":" + num + " " });
                    }
                }
                else {
                    results.push({ Verse: curdata });
                }

            } else
                if (numbers.indexOf("-") > 0) {
                    const numberary = numbers.split('-');
                    const fromVer = parseInt(numberary[0]);
                    const toVer = parseInt(numberary[1]);
                    for (let num = fromVer; num <= toVer; num++) {
                        results.push({ Verse: bookName + num });
                    }
                }
                else if (numbers.indexOf("(") > 0) {
                    const chapterN = numbers.indexOf("(");
                    const pt =
                        {
                            Verse: bookName + numbers.substring(0, chapterN)
                        };
                    const partialStr = numbers.substring(numbers.indexOf("("));
                    const startNTotal = partialStr.split(/[\(/\)]/);
                    pt.Part = parseInt(startNTotal[0]);
                    pt.Total = parseInt(startNTotal[1]);
                    results.push(pt);
                }
                else {
                    results.push({ Verse: curdata });
                }
        }



    }
    for (const rii in results) {
        const r = results[rii];
        if (r.Verse.indexOf(":") >= 0) continue;
        const lastChar = r.Verse[r.Verse.length - 1];
        if (lastChar >= '0' && lastChar <= '9')
            r.Verse += ":";
    }
    return retResult;
}


function GetOutput(all, shows) {
    let sb = '';
    for (let showi in shows) {
        const show = shows[showi];
        const result = [];
        for (let ti in all) {
            const t = all[ti];
            if (t.indexOf(show.Verse) === 0) {
                result.push(t);
            }
        }
        let startLimit = 0;
        let endLimit = result.length;
        if (show.Part !== 0) {
            startLimit = (show.Part - 1) * result.length / show.Total;
            endLimit = (show.Part) * result.length / show.Total;
            if (show.Part === result.length) endLimit++;
        }
        for (let i = 0; i < result.length; i++) {
            if (i < startLimit) continue;
            if (i >= endLimit) continue;
            const t = result[i];
            sb += (t) + ("\r\n");
        }
    }
    return sb;
}

function loadData(today) {

    const searches = GetTodaysSearch(today);
    if (searches === null) return null;

    const bibleData = fs.readFileSync('./lib/bibleUTF8.txt', 'utf8', function (err) {
        if (err) console.log('bibleutf error ' + err);
    }).split('\n');    
    
    const ret = {};
    const data = GetOutput(bibleData, searches.Verses);
    if (searches.Subject === null) return null;
    ret.SubjectTag = searches.Subject.trim().replace(/ /g,'');
    //var simpSub = TongWen.trans2Simp(searches.Subject);
    //if (simpSub == searches.Subject) {
    //    ret.Subject = searches.Subject;
    //}
    //else {
    //    ret.Subject = simpSub + ' (' + searches.Subject + ')';
    //}

    ret.Data = data;
    return ret;

}

//var resss = loadData(new Date());
//console.log(resss.Data);

function sendMailByMailGun(message) {
    var Mailgun = require('mailgun').Mailgun;

    var mg = new Mailgun('key-b9cc4c7cfe07d033dd507d4b1c89e635');
    return new Promise((resolve, reject) => {
        mg.sendText('gzhangx@gmail.com', [
                //'mailxinli@gmail.com',
                //'hebrewsofacccn@googlegroups.com'
                'gzhangx@hotmail.com'
            ],
            message.subject,
            message.text,
            function (err) {
                if (err) {
                    console.log('Oh noes: ' + err);
                    return reject({
                        status: 'Error',
                        error: err.message
                    });
                }
                else {
                    return resolve({
                        status: 'OK',
                        message,
                    });
                }
            });
    });

}

function SendEmail(now)
{
    if (!now) now = getTodayEST();
    const data = loadData(now);
    const message = {};
    
    message.subject = data.SubjectTag + ', ' + now.format('YYYY-MM-DD');
    console.log('sending ' + message.subject);
    //message.BodyEncoding = System.Text.Encoding.UTF8;
    message.text = data.Data;
    //Log(now.ToString("yyyy-MM-dd") + " " + sendTo + " " + message.Subject);         
    //SendMailDefaultFrom(message);
    //using (var sw = File.CreateText(@"c:\temp\bible\" + message.Subject.Replace("/", "_").Replace("\\", "_").Replace("<", "_").Replace(">", "_").Replace(":", "_").Replace("|", "_") + ".txt"))
    //{
    //    sw.WriteLine(data.Data);
    //}


    return sendMailByMailGun(message);
return data;
    var mandrill = require('mandrill-api/mandrill');
    var mandrill_client = new mandrill.Mandrill(process.env.MAILER_PASSWORD, true);

    var async = false;
    var ip_pool = "Main Pool";
    var send_at = "example send_at";
    message.from_email = "gzhangx@hotmail.com";
    message.from_name = "Gang Zhang";
    message.to = [{
        "email": "hebrewsofacccn@googlegroups.com",
        //"name": "Test",
        "type": "to"
    }
    ,{"email": "mailxinli@gmail.com"}
    ];

    mandrill_client.messages.send({ "message": message, "async": async, "ip_pool": ip_pool}, function (result) {
            console.log(result);
        }, function (e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
    return data;
}

//ScheduleToJson();
/*
for (var i = 0; i < 1000; i++) {
    var now = new Date();
    now.setDate(now.getDate()+i);
    console.log(now+"\r\n");
    var data = loadData(now);
    console.log(data.Subject+"\r\n");
    console.log('data='+data.Data+"\r\n");
}
/* */
//for (let i = 0; i < 100;i++) {
//    console.log(GetTodaysSearch(moment().add(i, 'days')));
//    console.log(loadData(moment().add(i, 'days')));
//}
//getd.SendEmail();

module.exports = {
    GetTodaysSearch,
    loadData,
    SendEmail
};