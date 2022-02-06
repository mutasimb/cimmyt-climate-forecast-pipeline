const
  R = require("../../utils/r-script.js"),
  log = require("../../utils/dev-log.js");

module.exports = ({ pathInputNC, pathMungbeanDir }) => new Promise((resolve, reject) => {
  log("Generating forecasts for IVR locations", "IVR_FORECAST");
  R(
    "server/r-scripts/uk-met-office-nc-to-ivr-forecast.R",
    {
      r_input_path_nc_file: pathInputNC,
      r_input_path_mungbean: pathMungbeanDir
    }
  ).then(output => {
    log("Forecasts generated", "IVR_FORECAST");
    resolve(output);
  }).catch(err => {
    log("Failed to generate forecasts", "IVR_FORECAST", false, true, true);
    reject(err);
  });
});
