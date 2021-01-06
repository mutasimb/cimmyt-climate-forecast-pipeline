const
  { CronJob } = require('cron'),

  log = require('./dev-log'),
  getForecast = require('./get-latest-forecast'),

  // jobRandom = new CronJob("0 0 0 * * *", getForecast),
  jobPeakHour = new CronJob("0 */5 9-10 * * *", getForecast),
  jobOffpeakHour = new CronJob("0 */10 11-23 * * *", getForecast);


module.exports = () => {
  // jobRandom.start();
  jobPeakHour.start();
  jobOffpeakHour.start();
  log("Jobs started", "CRON");
};
