const
  { join } = require("path"),
  { promisify } = require("util"),
  exists = promisify(require("fs").exists),
  readFile = promisify(require("fs").readFile),
  writeFile = promisify(require("fs").writeFile),
  { timeFormat } = require('d3-time-format'),

  { pathLocalMetOffice } = require('../../config/keys.js'),
  log = require("../../utils/dev-log.js"),

  checkExistence = require("./check-existence.js"),
  checkAvailability = require("./check-availability.js"),
  downloadFiles = require("./download-files.js"),
  generateOutput = require("./generate-output.js"),
  generateJSON = require("./generate-json-from-grib.js"),
  generateNC = require("./generate-nc.js"),
  pushMungbeanIVRData = require("../functions-ivr/"),

  formatFileIds = [
    "ground_precipitation-accumulation-1h_%Y%m%d00",
    "ground_precipitation-accumulation-3h_%Y%m%d00"
  ],
  formatNC = "uk-met-office_global-10km_utc-0000_%Y%m%d.nc";

module.exports = async () => {
  try {
    log("Initiating ...", "METOFFICEIVR_CORE");
    const
      targetDate = new Date(),
      pathOutputNC = join(pathLocalMetOffice, "netcdf", timeFormat(formatNC)(targetDate)),
      pathMetaData = join(pathLocalMetOffice, "latest-metadata-ivr.json");
    let
      downloadables = formatFileIds
        .map(el => timeFormat(el)(targetDate))
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
      downloadables = await checkAvailability(downloadables);
      downloadables = await downloadFiles(downloadables);

      existenceGrib2 = await checkExistence(downloadables.map(el => el.pathGrib2));
      if (!existenceGrib2) throw { message: "Failed to download files", devOnly: false };

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

    const [pushedToIVR] =
      ["mungbean_ivr"].map(
        el => metadataLatest &&
          'submitted' in metadataLatest &&
          'date' in metadataLatest &&
          metadataLatest.date === timeFormat("%Y%m%d")(targetDate)
          ? metadataLatest.submitted[el] : false
      );

    if (existenceNC && !pushedToIVR) {
      const pushedData = await pushMungbeanIVRData({ pathInputNC: pathOutputNC });

      metadataLatest = metadataLatest
        ? {
          ...metadataLatest,
          submitted: { ...metadataLatest.submitted, mungbean_ivr: true },
          submitted_data: { ...metadataLatest.submitted_data, mungbean_ivr: pushedData }
        }
        : {
          submitted: { mungbean_ivr: true },
          submitted_data: { mungbean_ivr: pushedData }
        };
      await writeFile(pathMetaData, JSON.stringify(metadataLatest, undefined, 2));
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
