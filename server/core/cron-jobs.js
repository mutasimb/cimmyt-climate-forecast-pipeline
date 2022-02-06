const
  { CronJob } = require('cron'),

  log = require('../utils/dev-log.js'),

  taskUkMetOfficeIVR = require('./functions-uk-met-office-ivr/'),

  jobUkMetOfficeIVRPeak = new CronJob("0 */5 10-12 * * *", taskUkMetOfficeIVR),
  jobUkMetOfficeIVROffPeak = new CronJob("0 */15 13-18 * * *", taskUkMetOfficeIVR);

module.exports = () => {
  log("Jobs starting ...", "CRON");

  taskUkMetOfficeIVR();
  jobUkMetOfficeIVRPeak.start();
  jobUkMetOfficeIVROffPeak.start();
};
