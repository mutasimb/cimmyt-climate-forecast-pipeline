const
  { promisify } = require("util"),
  writeFile = promisify(require("fs").writeFile),
  log = require("../../utils/dev-log.js");

module.exports = ({ pathOutput, pathOutputNC, date, files }) => new Promise((resolve, reject) => {
  writeFile(
    pathOutput,
    JSON.stringify({ pathOutputNC, submitted: { mungbean_ivr: false }, date, files }, undefined, 2)
  ).then(() => {
    log("Output latest-metadata-ivr.json generated", "METOFFICEIVR_OUTPUT");
    resolve();
  }).catch(err => {
    reject(err);
  });
});
