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

module.exports = async pathForecastBMD => {
  log("Initiating ...", "IVR_CORE", true);
  try {
    const
      { localCSV: pathLocalCSV, localJSON: pathLocalJSON } = await R("server/r-scripts/generate-ivr-output-paths.R", {
        r_input_path_nc_file: pathForecastBMD,
        r_input_path_local_mungbean: pathMungbean
      }),
      { data: forecastData } = await forecastGenerate(pathForecastBMD, pathMungbean),
      { provider: dataProvider } = directiveGenerate(forecastData);

    await writeFile(pathLocalJSON, JSON.stringify(
      {
        meta: {
          sourceBMD: {
            filename: pathForecastBMD.split("/").reverse()[0],
            timeDownloaded: (await stat(pathForecastBMD)).mtime
          },
          sourceLocal: {
            filename: pathLocalJSON.split("/").reverse()[0],
            timeGenerated: new Date()
          }
        },
        ...dataProvider
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
  } catch (err) {
    console.log(err);
  }
}
