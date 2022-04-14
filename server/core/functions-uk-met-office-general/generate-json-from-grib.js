const
  { join } = require("path"),

  log = require("../../utils/dev-log.js"),

  { pathLocalMetOffice } = require("../../config/keys.js"),

  GribToJSON = require("../../utils/grib-to-json/");

module.exports = files => new Promise((resolve, reject) => {
  log("Generating JSON files from downloaded grib2 files", "METOFFICEGENERAL_GENERATEJSON");
  Promise.all(
    files.map(file => GribToJSON({
      pathGribDir: join(pathLocalMetOffice, "grib2"),
      filenameGrib: file.fileId + ".grib2",
      pathOutputDir: join(pathLocalMetOffice, "json"),
      filenameOutput: file.fileId + ".json"
    }))
  ).then(res => {
    log("JSON files generated", "METOFFICEGENERAL_GENERATEJSON");
    resolve(res);
  }).catch(err => {
    log("Failed to generated JSON files", "METOFFICEGENERAL_GENERATEJSON", false, true, true);
    reject(err);
  });
});
