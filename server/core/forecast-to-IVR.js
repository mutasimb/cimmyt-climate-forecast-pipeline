const
  fs = require('fs'),
  { promisify } = require('util'),
  readFile = promisify(fs.readFile),
  writeFile = promisify(fs.writeFile),
  stat = promisify(fs.stat),

  log = require("../utils/dev-log"),

  { pathDateLog, pathMungbean } = require("../config/keys"),

  R = require("../utils/r-script"),

  forecastGenerate = require("./functions-ivr/generate-forecast-data"),
  directiveGenerate = require("./functions-ivr/generate-ivr-directives");

module.exports = async pathForecastBMD => new Promise(async (resolve, reject) => {
  log("Initiating ...", "IVR_CORE", false);
  try {
    const
      { localOutput: pathOutput } = await R("server/r-scripts/generate-ivr-output-paths.R", {
        r_input_path_nc_file: pathForecastBMD,
        r_input_path_local_mungbean: pathMungbean
      }),
      { data: forecastData } = await forecastGenerate(pathForecastBMD, pathMungbean),
      apiData = directiveGenerate(forecastData);

    await writeFile(pathOutput, JSON.stringify(
      {
        meta: {
          sourceBMD: {
            filename: pathForecastBMD.split("/").reverse()[0],
            timeDownloaded: (await stat(pathForecastBMD)).mtime
          },
          sourceLocal: {
            filename: pathOutput.split("/").reverse()[0],
            timeGenerated: new Date()
          }
        },
        ...apiData
      },
      undefined,
      2
    ));
    log("JSON record for IVR generated", "IVR_CORE", true);
      
    const dateLog = JSON.parse(await readFile(pathDateLog));
    await writeFile(pathDateLog, JSON.stringify({
      ...dateLog,
      ivr: {
        done: true,
        updatedAt: new Date()
      }
    }, undefined, 2));
    log("... finished", "IVR_CORE", false);
    resolve();
  } catch (err) {
    reject(err);
  }
});
