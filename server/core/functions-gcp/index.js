const
  log = require('../../utils/dev-log.js'),

  uploadToAgviselyServer = require('./upload.js');

module.exports = ({ pathInputNC }) => new Promise((resolve, reject) => {
  log("Initiating ...", "AGVISELY_CORE");

  uploadToAgviselyServer(pathInputNC)
    .then(() => {
      resolve();
    })
    .catch(err => {
      log(err, "AGVISELY_CORE CATCH", false, true, true);
      reject(err);
    })
    .finally(() => {
      log("... finished", "AGVISELY_CORE");
    });
});
