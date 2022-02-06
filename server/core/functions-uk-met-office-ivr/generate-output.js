const
  { promisify } = require("util"),
  writeFile = promisify(require("fs").writeFile),
  // R = require("../../utils/r-script.js"),
  log = require("../../utils/dev-log.js");

module.exports = ({ pathOutput, pathOutputNC, date, files }) => new Promise((resolve, reject) => {
  writeFile(
    pathOutput,
    JSON.stringify({ pathOutputNC, date, files }, undefined, 2)
  ).then(() => {
    log("Output latest-metadata.json generated", "METOFFICEIVR_OUTPUT");

    resolve();
  }).catch(err => {
    reject(err);
  });
});

// module.exports = ({ pathOutputNC, date, files }) => new Promise((resolve, reject) => {
//   R("server/r-scripts/uk-met-office-ivr-grib2-to-nc.R", {
//     r_input_path_output_nc: pathOutputNC,
//     r_input_target_date: date,
//     r_input_files_data: files
//   }).then(output => {
//     log(JSON.stringify(output), "METOFFICEIVR_GRIBTONC");
//     log("Output .nc generated", "METOFFICEIVR_GRIBTONC");
//     resolve(output);
//   }).catch(err => {
//     log("Error occurred during generation of output .nc", "METOFFICEIVR_GRIBTONC ERROR", false, true, true);
//     reject(err);
//   });
// });
