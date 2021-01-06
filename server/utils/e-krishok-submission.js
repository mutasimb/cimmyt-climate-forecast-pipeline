const
  axios = require('axios'),

  areaNames = require('../data/mungbean-areas'),
  messages = require('../data/forecast-messages'),

  { ekrishokHost, ekrishokPublicKey, ekrishokToken } = require('../config/keys'),

  forecastEKrishok = require('./e-krishok-forecast'),
  generateRecord = require('./e-krishok-generate-record'),
  log = require('./dev-log'),

  readyForecast = ({ forecast_tmn, forecast_tmx, forecast_case }) => {
    const { date, ...cases } = forecast_case;
    return {
      forecastTime: date[0],
      forecastAreas: Object.keys(cases).map(l => {
        const { code, ...area } = areaNames.find(el => el.code == l);
        return {
          areaId: l,
          area,
          forecastData: date.map((d, i) => ({
            date: d,
            tmn: forecast_tmn[l][i],
            tmx: forecast_tmx[l][i],
            ...messages.find(el => el.forecastId == cases[l][i])
          }))
        }
      })
    };
  };

module.exports = path => new Promise(async (resolve, reject) => {
  try {
    log(`Calculating forecast data for mungbean areas: ${path}`, "EKRISHOK", false);
    const
      forecast = await forecastEKrishok(path),
      { forecast_tmn, forecast_tmx, forecast_case } = forecast,

      submissionRes = await axios({
        method: 'post',
        url: ekrishokHost,
        headers: {
          "Publickey": ekrishokPublicKey,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Postman-Token": ekrishokToken
        },
        data: readyForecast({ forecast_tmn, forecast_tmx, forecast_case })
      });
    log("Forecast data for mungbean areas submitted to e-krishok", "EKRISHOK", false);

    const record = await generateRecord(forecast);
    log(`E-krishok submission log generated: ${record.pathLog}`, "EKRISHOK", false);

    resolve(submissionRes.data);
  } catch (err) {
    reject(err);
  }
});
