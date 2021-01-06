const
  R = require('./r-script'),

  { ncPath, mungbeanPath } = require('../config/keys');

module.exports = path => new Promise(async (resolve, reject) => {
  try {
    const listNc = path
      ? null
      : await R(
        "server/r-scripts/list-files.R",
        {
          r_input_path_nc: ncPath
        }
      );
    const mungbeanForecast = await R(
      "server/r-scripts/e-krishok-forecast.R",
      {
        r_input_path_nc_file: path && !listNc ? path : ncPath + '/' + listNc[0].filename,
        r_input_path_mungbean: mungbeanPath
      }
    );
    resolve(mungbeanForecast);
  } catch (err) {
    reject(err);
  }
});
