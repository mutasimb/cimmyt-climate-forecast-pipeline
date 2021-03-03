const
  R = require('../../utils/r-script'),

  areaNames = require('../../data/ekrishok-areas'),
  
  log = require("../../utils/dev-log");

module.exports = (pathLocal, forecast) => new Promise((resolve, reject) => {
  log("Generating record", "EKRISHOK_RECORD", false);
  R("server/r-scripts/generate-record-ekrishok.R", {
    r_input_forecast: JSON.stringify(forecast),
    r_input_area_names: JSON.stringify(areaNames),
    r_input_path_record: pathLocal
  }).then(output => {
    log("Record generated", "EKRISHOK_RECORD", false);
    resolve(output.pathRecordCSV);
  }).catch(err => {
    log("Record generation failed", "EKRISHOK_RECORD", false, true, true);
    reject(err);
  })
});
