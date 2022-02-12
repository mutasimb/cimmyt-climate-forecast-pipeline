const
  log = require('../../utils/dev-log.js'),

  generateCSV = require('./generate-csv.js'),
  uploadToWheatBlastServer = require('./upload.js');

module.exports = ({ pathInputNC, date }) => new Promise((resolve, reject) => {
  log("Initiating ...", "WHEATBLAST_CORE");

  generateCSV(pathInputNC, date)
    .then(pathCSV => uploadToWheatBlastServer(pathCSV))
    .then(() => {
      resolve();
    })
    .catch(err => {
      log(err, "WHEATBLAST_CORE CATCH", false, true, true);
      reject(err);
    })
    .finally(() => {
      log("... finished", "WHEATBLAST_CORE");
    });
});
