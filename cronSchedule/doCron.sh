echo $1
cd /home/pi/bibleSender
/usr/bin/node cronSchedule/execCron.js $1 >> /home/pi/logs$1.log 2>&1
