const
  fs = require('fs'),
  { promisify } = require('util'),
  readFile = promisify(fs.readFile),
  writeFile = promisify(fs.writeFile),

  log = require('../utils/dev-log'),
  R = require('../utils/r-script'),

  { pathDateLog, pathDownload, pathLocalWB, pathWB } = require('../config/keys'),

  processForecast = require('./functions-wb/process-from-downloaded-file'),
  pushToServer = require('./functions-wb/upload');

module.exports = pathForecastBMD => new Promise(async (resolve, reject) => {
  log("Initiating ...", "WB_CORE", false);
  try {
    const
      { local: pathLocal, remote: pathRemote } = await R("server/r-scripts/generate-wb-output-paths.R", {
        r_input_path_nc_file: pathForecastBMD,
        r_input_path_download_dir: pathDownload,
        r_input_path_local_wb: pathLocalWB,
        r_input_path_remote_wb: pathWB
      }),

      pathWBReadyCSV = await processForecast(pathForecastBMD, pathLocal);

    await pushToServer(pathWBReadyCSV, pathRemote);

    const dateLog = JSON.parse(await readFile(pathDateLog));
    await writeFile(pathDateLog, JSON.stringify({
      ...dateLog,
      wheatBlast: {
        done: true,
        updatedAt: new Date()
      }
    }, undefined, 2));
    resolve();
    log("... finished", "WB_CORE", false);
  } catch (err) {
    reject(err);
  }
});
