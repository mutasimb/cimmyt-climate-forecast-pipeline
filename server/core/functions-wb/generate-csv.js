const
  { join } = require("path"),

  R = require('../../utils/r-script.js'),
  log = require('../../utils/dev-log.js'),

  { pathLocalWB } = require('../../config/keys.js');

module.exports = (pathNC, date) => new Promise((resolve, reject) => {
  log("Generating .csv from .nc", "WHEATBLAST_CSV");

  R(
    join(__dirname, "nc-to-wheat-blast-csv.R"),
    {
      r_input_path_nc_file: pathNC,
      r_input_path_wb_dir: pathLocalWB,
      r_input_date_str: date
    }
  ).then(output => {
    log("Generated .csv file", "WHEATBLAST_CSV");
    resolve(output.pathGeneratedCSV);
  }).catch(err => {
    log("Generation of .csv failed", "WHEATBLAST_CSV CATCH", false, true, true);
    reject(err);
  });
});
