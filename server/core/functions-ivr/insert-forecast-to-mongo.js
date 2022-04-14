const
  { connect, connection, Schema, model } = require("mongoose"),
  { timeParse, timeFormat } = require("d3-time-format"),
  { timeDay } = require("d3-time"),

  estimateSkipBroadcast = require("./estimate-skip-broadcast.js"),

  { uriDistributorAPI } = require("../../config/keys.js"),
  log = require("../../utils/dev-log.js"),

  MungbeanForecastSchema = new Schema({
    dateBroadcast: { type: Number, required: true },
    location: { type: String, required: true },
    rain: [{ type: Number, required: true }],
    skip: { type: Boolean, default: false }
  }),
  MungbeanForecast = model("mungbean-forecasts", MungbeanForecastSchema);

module.exports = ({ dateBroadcast, forecast }) => new Promise((resolve, reject) => {
  const
    todayDate = timeParse("%y%m%d")(dateBroadcast),
    pastDates = [1, 2, 3].map(d => timeDay.offset(todayDate, -d)),
    datePast = pastDates.map(d => +timeFormat("%y%m%d")(d));

  log("Inserting forecast data to distributor server database", "IVR_INSERT");
  connect(uriDistributorAPI).then(() => {
    log("Connected to database, retrieving forecast data for last 3 days", "IVR_INSERT");
    return MungbeanForecast.find({ dateBroadcast: { $in: datePast } });
  }).then(docs => {
    log("Data retrieved, analyzing", "IVR_INSERT");
    const forecastToday = estimateSkipBroadcast({
      pastDates: datePast,
      past: docs,
      today: forecast.map(el => ({ dateBroadcast: +dateBroadcast, ...el }))
    });
    return MungbeanForecast.insertMany(forecastToday);
  }).then(docs => {
    log("Forecast data successfully inserted", "IVR_INSERT");
    connection.close(true, () => {
      log("Database connection closed", "IVR_INSERT");
      resolve(docs);
    });
  }).catch(err => {
    connection.close(true, () => {
      log("Database connection closed", "IVR_INSERT");
      reject(err);
    });
  });
});
