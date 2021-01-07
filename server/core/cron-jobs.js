const
  { CronJob } = require('cron'),

  { NODE_ENV } = process.env,

  log = require('../utils/dev-log'),
  getForecast = require('./get-latest-forecast'),

  jobPeakHour = new CronJob("0 */5 9-10 * * *", getForecast),
  jobOffpeakHour = new CronJob(`0 */${NODE_ENV === 'production' ? '10' : '5'} 11-23 * * *`, getForecast);


module.exports = () => {
  if (NODE_ENV !== 'production') getForecast();
  jobPeakHour.start();
  jobOffpeakHour.start();
  log("Jobs started", "CRON");
};
