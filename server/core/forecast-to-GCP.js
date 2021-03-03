const
  fs = require('fs'),
  { promisify } = require('util'),
  readFile = promisify(fs.readFile),
  writeFile = promisify(fs.writeFile),

  { pathDateLog } = require("../config/keys"),

  log = require('../utils/dev-log'),
  
  processForecast = require('./functions-gcp/process-from-downloaded-file');
  // pushToServer = require('./functions-gcp/upload');

module.exports = async pathForecastBMD => {
  log("Initiating ...", "GCP_CORE", true);
  try {
    const
      pathGCPReadyNC = await processForecast(pathForecastBMD);

    // await pushToServer(pathGCPReadyNC);
    const dateLog = JSON.parse(await readFile(pathDateLog));
    await writeFile(pathDateLog, JSON.stringify({
      ...dateLog,
      agvisely: {
        done: true,
        updatedAt: new Date()
      }
    }, undefined, 2));
  } catch (err) {
    console.log(err);
  } finally {
    log("... finished", "GCP_CORE", true);
  }
};
