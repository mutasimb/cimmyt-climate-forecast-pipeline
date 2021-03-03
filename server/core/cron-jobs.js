const
  { CronJob } = require('cron'),

  { NODE_ENV } = process.env,

  log = require('../utils/dev-log'),
  job = require('./task-download-n-process'),

  jobPeakHour = new CronJob("0 */5 9-10 * * *", job),
  jobOffpeakHour = new CronJob(`0 */${NODE_ENV === 'production' ? '10' : '5'} 11-23 * * *`, job);


module.exports = () => {
  // if (NODE_ENV !== 'production') job();
  job();
  jobPeakHour.start();
  jobOffpeakHour.start();
  log("Jobs started", "CRON");
};
