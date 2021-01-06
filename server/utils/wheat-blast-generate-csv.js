const
  R = require('./r-script'),

  log = require('./dev-log'),

  { pathDownload } = require('../config/keys');

module.exports = path => new Promise((resolve, reject) => {
  log(`Generating CSV from .nc to upload to Wheat Blast server: ${path}`, "BLASTCSV", false);
  R(
    "server/r-scripts/generate-csv.R",
    {
      r_input_path_download_dir: pathDownload,
      r_input_path_input_file_nc: path
    }
  ).then(output => {
    log(`CSV generated: ${output.pathOutputCSV}`, "BLASTCSV", false);
    resolve(output.pathOutputCSV);
  }).catch(err => {
    log(`Something went wrong while generating the CSV: ${path}`, "BLASTCSV", false);
    reject(err);
  });
});
