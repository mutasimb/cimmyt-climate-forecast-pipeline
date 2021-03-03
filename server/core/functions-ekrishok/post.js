const
  axios = require('axios'),

  { ekrishokHost, ekrishokPublicKey, ekrishokToken } = require('../../config/keys'),

  areaNames = require('../../data/ekrishok-areas'),
  messages = require('../../data/forecast-messages'),

  log = require("../../utils/dev-log"),

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

module.exports = ({ forecast_tmn, forecast_tmx, forecast_case }) => new Promise((resolve, reject) => {
  log("Posting data", "EKRISHOK_SUBMISSION", true);
  axios({
    method: 'post',
    url: ekrishokHost,
    headers: {
      "Publickey": ekrishokPublicKey,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Postman-Token": ekrishokToken
    },
    data: readyForecast({ forecast_tmn, forecast_tmx, forecast_case })
  })
    .then(res => {
      log("Data posted", "EKRISHOK_SUBMISSION", true);
      resolve(res.data);
    })
    .catch(err => {
      log("Data posting failed", "EKRISHOK_SUBMISSION", false, true, true);
      reject(err);
    });
});
