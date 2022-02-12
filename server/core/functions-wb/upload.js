const
  { Client: SCPClient } = require('scp2'),

  log = require('../../utils/dev-log.js'),

  { hostWB, userWB, passWB, pathWB } = require('../../config/keys.js');

module.exports = path => new Promise((resolve, reject) => {
  const clientWheatBlast = new SCPClient({
    port: 22,
    host: hostWB,
    username: userWB,
    password: passWB
  });

  log("Initiating upload to Wheat Blast server", "WHEATBLAST_UPLOAD");
  clientWheatBlast.upload(
    path,
    pathWB,
    err => {
      if (err) {
        log("Upload failed", "WHEATBLAST_UPLOAD ERROR", false);
        clientWheatBlast.close();
        reject(err);
      }
      log("Successfully uploaded", "WHEATBLAST_UPLOAD", false);
      clientWheatBlast.close();
      resolve();
    }
  );
});
