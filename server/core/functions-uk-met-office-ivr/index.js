const
  { timeFormat } = require('d3-time-format'),

  { pathLocalMetOffice, pathMungbean } = require('../../config/keys.js'),
  log = require("../../utils/dev-log.js"),

  checkExistence = require("./check-existence.js"),
  checkAvailability = require("./check-availability.js"),
  downloadFiles = require("./download-files.js"),
  generateOutput = require("./generate-output.js"),
  generateIVRDirectiveJSON = require("../functions-ivr/"),

  formatFileIds = [
    "ground_precipitation-accumulation-1h_%Y%m%d00",
    "ground_precipitation-accumulation-3h_%Y%m%d00"
  ],
  formatNC = "uk-met-office_global-10km_utc-0000_%Y%m%d.nc",
  formatIVRDirectiveJSON = "uk-met-office_global-10km_utc-0000_ivr_%Y%m%d.json";

module.exports = async () => {
  try {
    log("Initiating ...", "METOFFICEIVR_CORE");
    const
      targetDate = new Date(),
      pathOutputNC = pathLocalMetOffice + "/" + timeFormat(formatNC)(targetDate),
      pathDirectiveJSON = pathMungbean + "/" + timeFormat(formatIVRDirectiveJSON)(targetDate);
    let
      downloadables = formatFileIds
        .map(el => timeFormat(el)(targetDate))
        .map(el => ({ fileId: el, path: pathLocalMetOffice + "/downloads/" + el + ".grib2" })),
      existenceGrib2 = await checkExistence([...downloadables.map(el => el.path)]),
      existenceNC = await checkExistence([pathOutputNC]),
      existenceJSON = await checkExistence([pathDirectiveJSON]);

    if (!existenceGrib2) {
      // Expected .grib2 files don't exist

      downloadables = await checkAvailability(downloadables);
      downloadables = await downloadFiles(downloadables);

      existenceGrib2 = await checkExistence(downloadables.map(el => el.path));
      if (!existenceGrib2) throw { message: "Failed to download files", devOnly: false };

      await generateOutput({
        pathOutput: pathLocalMetOffice + "/downloads/latest-metadata.json",
        pathOutputNC,
        date: timeFormat("%Y%m%d")(targetDate),
        files: downloadables
      });

      // manual grib2-to-nc conversion required at this point
    }
    if (existenceNC && !existenceJSON) {
      // Expected .nc is present but expected .json doesn't exist

      log("Output .nc exists but .json doesn't", "METOFFICEIVR_CORE");
      await generateIVRDirectiveJSON({ pathInput: pathOutputNC, pathOutput: pathDirectiveJSON });
    }
  } catch (err) {
    if ("message" in err && "devOnly" in err) {
      log(err.message, "METOFFICEIVR_CORE CATCH", err.devOnly, true, true);
    } else {
      log(err, "METOFFICEIVR_CORE CATCH UNKNOWN", err.devOnly, true, true);
    }
  } finally {
    log("... finished", "METOFFICEIVR_CORE");
  }
};
