const
  R = require('../../utils/r-script'),
  log = require('../../utils/dev-log'),

  { pathDownload, pathMungbean } = require('../../config/keys');

module.exports = path => new Promise((resolve, reject) => {
  log("Processing data", "EKRISHOK_PROCESS", false);
  R("server/r-scripts/bmd-nc-to-ekrishok.R", {
    r_input_path_nc_file: path,
    r_input_path_download_dir: pathDownload,
    r_input_path_mungbean: pathMungbean
  }).then(output => {
    log("Data processed", "EKRISHOK_PROCESS", false);
    resolve(output);
  }).catch(err => {
    log("Data processing failed", "EKRISHOK_PROCESS", false, true, true);
    reject(err);
  })
});
