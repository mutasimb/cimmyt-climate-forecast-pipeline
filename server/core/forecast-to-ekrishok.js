const
  fs = require('fs'),
  { promisify } = require('util'),
  readFile = promisify(fs.readFile),
  writeFile = promisify(fs.writeFile),

  R = require('../utils/r-script'),
  log = require('../utils/dev-log'),
  
  { pathDateLog, pathMungbean } = require('../config/keys'),

  processForecast = require('./functions-ekrishok/process-from-downloaded-file'),
  postData = require('./functions-ekrishok/post'),
  generateRecord = require('./functions-ekrishok/generate-record');

module.exports = async pathForecastBMD => {
  log("Initiating ...", "EKRISHOK_CORE", true);
  try {
    const
      { local: pathLocalCSV } = await R("server/r-scripts/generate-ekrishok-output-paths.R", {
        r_input_path_nc_file: pathForecastBMD,
        r_input_path_local_mungbean: pathMungbean
      });

    const forecast = await processForecast(pathForecastBMD);
    await postData(forecast);
    await generateRecord(pathLocalCSV, forecast);
    
    const dateLog = JSON.parse(await readFile(pathDateLog));
    await writeFile(pathDateLog, JSON.stringify({
      ...dateLog,
      eKrishok: {
        done: true,
        updatedAt: new Date()
      }
    }, undefined, 2));
  } catch (err) {
    console.log(err);
  } finally {
    log("... finished", "EKRISHOK_CORE", true);
  }
};
