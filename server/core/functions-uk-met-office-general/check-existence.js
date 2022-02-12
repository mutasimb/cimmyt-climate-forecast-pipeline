const
  { promisify } = require("util"),
  exists = promisify(require("fs").exists),

  log = require("../../utils/dev-log.js");

module.exports = paths => new Promise((resolve, reject) => {
  log(
    "Checking existence of the following files in local directory:\n-- " + paths.join("\n-- "),
    "METOFFICEGENERAL_CHECKEXISTENCE"
  );

  Promise.all(paths.map(path => exists(path)))
    .then(existences => {
      const existence = existences.every(el => el);

      log("Files " + (existence ? "" : "don't ") + "exist", "METOFFICEGENERAL_CHECKEXISTENCE");
      resolve(existence);
    })
    .catch(err => {
      reject(err);
    });
});
