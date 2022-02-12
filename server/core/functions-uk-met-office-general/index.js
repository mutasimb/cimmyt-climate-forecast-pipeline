const
  { promisify } = require("util"),
  exists = promisify(require("fs").exists),
  readFile = promisify(require("fs").readFile),
  writeFile = promisify(require("fs").writeFile),
  { timeFormat } = require('d3-time-format'),

  { pathLocalMetOffice } = require('../../config/keys.js'),
  log = require("../../utils/dev-log.js"),

  getTargetDate = require("./get-target-date.js"),
  checkExistence = require("./check-existence.js"),
  checkAvailability = require("./check-availability.js"),
  downloadFiles = require("./download-files.js"),
  generateOutput = require("./generate-output.js"),

  deployAgviselyData = require("../functions-gcp/"),
  deployWheatBlastData = require("../functions-wb/"),

  formatFileIds = [
    "agl_relative-humidity_1.5_%Y%m%d12",
    "agl_temperature_1.5_%Y%m%d12",
    "ground_precipitation-accumulation-1h_%Y%m%d12",
    "ground_precipitation-accumulation-3h_%Y%m%d12",
    "ground_precipitation-accumulation-6h_%Y%m%d12_150"
  ],
  formatNC = "uk-met-office_global-10km_utc-1200_%Y%m%d.nc";

module.exports = async () => {
  try {
    log("Initiating ...", "METOFFICEGENERAL_CORE");

    const
      targetDate = getTargetDate(),
      filenameDateAfterUTCOffset = new Date(targetDate.getTime());

    filenameDateAfterUTCOffset.setDate(filenameDateAfterUTCOffset.getDate() - 1);

    const
      pathOutputNC = pathLocalMetOffice + "/" + timeFormat(formatNC)(targetDate),
      pathMetaData = pathLocalMetOffice + "/downloads/latest-metadata-general.json";
    let
      downloadables = formatFileIds
        .map(el => timeFormat(el)(filenameDateAfterUTCOffset))
        .map(el => ({ fileId: el, path: pathLocalMetOffice + "/downloads/" + el + ".grib2" })),
      existenceGrib2 = await checkExistence([...downloadables.map(el => el.path)]),
      existenceNC = await checkExistence([pathOutputNC]),
      metadataLatest = await exists(pathMetaData) ? JSON.parse(await readFile(pathMetaData)) : null;

    if (!existenceGrib2) {
      // Expected .grib2 files don't exist

      downloadables = await checkAvailability(downloadables);
      downloadables = await downloadFiles(downloadables);

      existenceGrib2 = await checkExistence(downloadables.map(el => el.path));
      if (!existenceGrib2) throw { message: "Failed to download files", devOnly: false };

      await generateOutput({
        pathOutput: pathLocalMetOffice + "/downloads/latest-metadata-general.json",
        pathOutputNC,
        date: timeFormat("%Y%m%d")(targetDate),
        files: downloadables
      });

      metadataLatest = JSON.parse(await readFile(pathMetaData));

      // manual grib2-to-nc conversion required at this point
    }

    const [sentToAgvisely, sentToWheatBlast] =
      ["agvisely", "wheat_blast_ews"].map(
        el => metadataLatest &&
          'scp' in metadataLatest &&
          'date' in metadataLatest &&
          metadataLatest.date === timeFormat("%Y%m%d")(targetDate)
          ? metadataLatest.scp[el] : false
      );

    if (existenceNC && !sentToAgvisely) {
      await deployAgviselyData({ pathInputNC: pathOutputNC });

      metadataLatest = { ...metadataLatest, scp: { ...metadataLatest.scp, agvisely: true } };
      await writeFile(pathMetaData, JSON.stringify(metadataLatest, undefined, 2));
    }

    if (existenceNC && !sentToWheatBlast) {
      await deployWheatBlastData({ pathInputNC: pathOutputNC, date: timeFormat("%Y%m%d")(targetDate) });

      metadataLatest = { ...metadataLatest, scp: { ...metadataLatest.scp, wheat_blast_ews: true } };
      await writeFile(pathMetaData, JSON.stringify(metadataLatest, undefined, 2));
    }

  } catch (err) {
    if ("message" in err && "devOnly" in err) {
      log(err.message, "METOFFICEGENERAL_CORE CATCH", err.devOnly, true, true);
    } else {
      log(err, "METOFFICEGENERAL_CORE CATCH UNKNOWN", err.devOnly, true, true);
    }
  } finally {
    log("... finished", "METOFFICEGENERAL_CORE");
  }
};
