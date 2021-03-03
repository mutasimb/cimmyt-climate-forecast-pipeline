const
  { Client: SCPClient } = require('scp2'),

  log = require('../../utils/dev-log'),

  { hostWB, userWB, passWB } = require('../../config/keys');

module.exports = (pathFrom, pathTo) => new Promise((resolve, reject) => {
  const clientBrazil = new SCPClient({
    port: 22,
    host: hostWB,
    username: userWB,
    password: passWB
  });
  
  log(`Initiating upload to Wheat Blast server: ${pathFrom}`, "WB_UPLOAD", false);
  clientBrazil.upload(
    pathFrom,
    pathTo,
    err => {
      if (err) {
        log(`Upload failed: ${pathFrom}`, "WB_UPLOAD", false);
        clientBrazil.close();
        reject(err);
      }
      log(`Successfully uploaded to: ${userWB + "@" + hostWB + ":" + pathTo}`, "WB_UPLOAD", false);
      clientBrazil.close();
      resolve();
    }
  );
});
