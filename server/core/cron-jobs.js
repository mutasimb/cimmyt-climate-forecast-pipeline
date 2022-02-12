const
  { CronJob } = require('cron'),

  log = require('../utils/dev-log.js'),

  taskUkMetOfficeGeneral = require('./functions-uk-met-office-general/'),
  taskUkMetOfficeIVR = require('./functions-uk-met-office-ivr/'),

  jobUkMetOfficeGeneralPeak = new CronJob("0 */5 22-23 * * *", taskUkMetOfficeGeneral),
  jobUkMetOfficeGeneralOffPeak = new CronJob("0 */15 0-17 * * *", taskUkMetOfficeGeneral),

  jobUkMetOfficeIVRPeak = new CronJob("0 */5 10-12 * * *", taskUkMetOfficeIVR),
  jobUkMetOfficeIVROffPeak = new CronJob("0 */15 13-17 * * *", taskUkMetOfficeIVR);

module.exports = () => {
  log("Jobs starting ...", "CRON");

  jobUkMetOfficeGeneralPeak.start();
  jobUkMetOfficeGeneralOffPeak.start();
  taskUkMetOfficeGeneral();

  jobUkMetOfficeIVRPeak.start();
  jobUkMetOfficeIVROffPeak.start();
  taskUkMetOfficeIVR();
};
