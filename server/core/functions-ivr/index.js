const
  log = require("../../utils/dev-log.js"),

  { pathMungbean } = require("../../config/keys.js"),

  forecastGenerate = require("./generate-forecast-data.js"),
  insertToDB = require("./insert-forecast-to-mongo.js");

module.exports = ({ pathInputNC }) =>
  new Promise(async (resolve, reject) => {
    log("Initiating ...", "IVR_CORE", false);
    try {
      const
        { dateBroadcast, forecast } = await forecastGenerate({
          pathInputNC,
          pathMungbeanDir: pathMungbean
        }),
        insertedDocs = await insertToDB({ dateBroadcast, forecast });

      resolve(insertedDocs);
    } catch (err) {
      reject(err);
    } finally {
      log("... finished", "IVR_CORE");
    }
  });
