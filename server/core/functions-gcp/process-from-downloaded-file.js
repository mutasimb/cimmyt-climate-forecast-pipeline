const
  R = require('../../utils/r-script'),
  log = require('../../utils/dev-log'),
  
  { ncPath, pathDownload } = require('../../config/keys');

module.exports = path => new Promise((resolve, reject) => {
  log(`Processing downloaded file: ${path}`, "GCP_PROCESS", true);
  R(
    "server/r-scripts/bmd-nc-to-gcp.R",
    {
      r_input_path_nc_file: path,
      r_input_path_download_dir: pathDownload,
      r_input_path_nc_dir: ncPath
    }
  ).then(output => {
    log(`Generated GCP ready output: ${output.pathGCPReadyNC}`, "GCP_PROCESS", true);
    resolve(output.pathGCPReadyNC);
  }).catch(err => {
    log(`Failed to generate GCP ready output`, "GCP_PROCESS", true, true, true);
    reject(err);
  });
});
