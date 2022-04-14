const
  { join } = require("path"),
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
  generateJSON = require("./generate-json-from-grib.js"),
  generateNC = require("./generate-nc.js"),

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
      pathOutputNC = join(pathLocalMetOffice, "netcdf", timeFormat(formatNC)(targetDate)),
      pathMetaData = join(pathLocalMetOffice, "latest-metadata-general.json");
    let
      downloadables = formatFileIds
        .map(el => timeFormat(el)(filenameDateAfterUTCOffset))
        .map(el => ({
          fileId: el,
          pathGrib2: join(pathLocalMetOffice, "grib2", el + ".grib2"),
          pathJson: join(pathLocalMetOffice, "json", el + ".json")
        })),
      existenceGrib2 = await checkExistence([...downloadables.map(el => el.pathGrib2)]),
      existenceJSON = await checkExistence([...downloadables.map(el => el.pathJson)]),
      existenceNC = await checkExistence([pathOutputNC]),
      metadataLatest = await exists(pathMetaData) ? JSON.parse(await readFile(pathMetaData)) : null;

    if (!existenceGrib2) {
      // Expected .grib2 files don't exist

      downloadables = await checkAvailability(downloadables);
      downloadables = await downloadFiles(downloadables);

      existenceGrib2 = await checkExistence(downloadables.map(el => el.pathGrib2));
      if (!existenceGrib2) throw { message: "Failed to download grib2 files", devOnly: false };

      await generateOutput({
        pathOutput: pathMetaData,
        pathOutputNC,
        date: timeFormat("%Y%m%d")(targetDate),
        files: downloadables
      });

      metadataLatest = JSON.parse(await readFile(pathMetaData));
    }

    if (!existenceJSON && existenceGrib2) {
      await generateJSON(downloadables);
      existenceJSON = await checkExistence([...downloadables.map(el => el.pathJson)]);
      if (!existenceJSON) throw { message: "Failed to generate json files", devOnly: false };
    }

    if (!existenceNC && existenceJSON && existenceGrib2) {
      await generateNC({
        date: timeFormat("%Y%m%d")(targetDate),
        pathsJSON: downloadables.map(file => file.pathJson),
        pathNC: pathOutputNC
      });
      existenceNC = await checkExistence([pathOutputNC]);
      if (!existenceNC) throw { message: "Failed to generate nc file", devOnly: false };
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
