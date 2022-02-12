const
  { promisify } = require("util"),
  writeFile = promisify(require("fs").writeFile),
  log = require("../../utils/dev-log.js");

module.exports = ({ pathOutput, pathOutputNC, date, files }) => new Promise((resolve, reject) => {
  writeFile(
    pathOutput,
    JSON.stringify({
      pathOutputNC,
      scp: { agvisely: false, wheat_blast_ews: false },
      date,
      files
    }, undefined, 2)
  )
    .then(() => {
      log("Output latest-metadata-general.json generated", "METOFFICEGENERAL_OUTPUT");
      resolve();
    })
    .catch(err => {
      reject(err);
    });
});
