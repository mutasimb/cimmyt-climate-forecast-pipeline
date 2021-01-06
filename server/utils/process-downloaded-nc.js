const
  R = require('./r-script'),

  log = require('./dev-log'),

  { pathDownload, ncPath } = require('../config/keys');

module.exports = path => new Promise((resolve, reject) => {
  log(`Processing downloaded file: ${path}`, "PROCESSBMD", false)
  R(
    "server/r-scripts/process-bmd-nc.R",
    {
      r_input_path_nc_file: path,
      r_input_path_download: pathDownload,
      r_input_path_nc_dir: ncPath
    }
  ).then(output => {
    log(`Generated processed forecast: ${output.output}`, "PROCESSBMD", false)
    resolve(output);
  }).catch(err => {
    log(`Failed to generated processed forecast`, "PROCESSBMD CATCH", false)
    reject({ log: true, msg: err });
  });
});
