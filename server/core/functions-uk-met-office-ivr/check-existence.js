const
  { promisify } = require("util"),
  exists = promisify(require("fs").exists),

  log = require("../../utils/dev-log.js");

module.exports = paths => new Promise(async (resolve, reject) => {
  log(
    "Checking existence of the following files in local directory:\n-- " + paths.join("\n-- "),
    "METOFFICEIVR_CHECKEXISTENCE"
  );
  try {
    const
      existences = await Promise.all(paths.map(path => exists(path))),
      existence = existences.every(el => el);

    log("Files " + (existence ? "" : "don't ") + "exist", "METOFFICEIVR_CHECKEXISTENCE");
    resolve(existence);
  } catch (err) {
    reject(err);
  }
});
