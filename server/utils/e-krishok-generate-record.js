const
  R = require('./r-script'),

  { mungbeanPath } = require('../config/keys'),

  areaNames = require('../data/mungbean-areas');

module.exports = forecast => new Promise((resolve, reject) => {
  R(
    "server/r-scripts/e-krishok-generate-record.R",
    {
      r_input_forecast: JSON.stringify(forecast),
      r_input_area_names: JSON.stringify(areaNames),
      r_input_path_mungbean: mungbeanPath
    }
  ).then(output => {
    resolve(output);
  }).catch(err => {
    reject({ log: true, msg: err });
  })
});
