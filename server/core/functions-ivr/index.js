const
  fs = require('fs'),
  { promisify } = require('util'),
  writeFile = promisify(fs.writeFile),
  { timeFormat } = require("d3-time-format"),

  log = require("../../utils/dev-log.js"),

  { pathMungbean } = require("../../config/keys.js"),

  forecastGenerate = require("./generate-forecast-data.js"),
  directiveGenerate = require("./generate-ivr-directives.js");

module.exports = ({ pathInput, pathOutput }) => new Promise(async (resolve, reject) => {
  log("Initiating ...", "IVR_CORE", false);
  try {
    const
      dailyForecastDataSelectedArea = await forecastGenerate({
        pathInputNC: pathInput,
        pathMungbeanDir: pathMungbean
      }),
      apiData = await directiveGenerate(dailyForecastDataSelectedArea);

    await writeFile(pathOutput, JSON.stringify(
      {
        source: {
          filename: pathOutput.split("/").reverse()[0],
          timeGenerated: timeFormat("%x %X")(new Date())
        },
        ...apiData
      },
      undefined,
      2
    ));
    log("JSON record for IVR generated", "IVR_CORE");

    resolve();
  } catch (err) {
    reject(err);
  } finally {
    log("... finished", "IVR_CORE");
  }
});
