const
  R = require('../../utils/r-script'),
  log = require('../../utils/dev-log');

module.exports = (pathInput, pathOutput) => new Promise((resolve, reject) => {
  log(`Processing downloaded file: ${pathInput}`, "WB_PROCESS", false);
  R(
    "server/r-scripts/bmd-nc-to-wb-csv.R",
    {
      r_input_path_nc_file: pathInput,
      r_input_path_output_csv: pathOutput
    }
  ).then(output => {
    log(`Generated WB ready CSV: ${output.pathWBReadyCSV}`, "WB_PROCESS", false);
    resolve(output.pathWBReadyCSV);
  }).catch(err => {
    log(`Failed to generate WB ready CSV`, "WB_PROCESS", false, true, true);
    reject(err);
  });
});
