const
  { Client: SCPClient } = require('scp2'),

  log = require('./dev-log'),
  deleteFile = require('./delete-file'),

  generateCSV = require('./wheat-blast-generate-csv'),

  { hostWB, userWB, passWB, pathWB } = require('../config/keys');

module.exports = path => new Promise(async (resolve, reject) => {
  try {
    const
      pathCSV = await generateCSV(path),
      clientBrazil = new SCPClient({
        port: 22,
        host: hostWB,
        username: userWB,
        password: passWB
      });

    log(`Initiating upload CSV to Wheat Blast server: ${pathCSV}`, "UPLOADWB", false);
    clientBrazil.upload(
      pathCSV,
      pathWB + "/d01-outputs/",
      err => {
        if (err) {
          log(`Upload failed: ${pathCSV}`, "UPLOADWB", false);
          clientBrazil.close();
          deleteFile(pathCSV, "UPLOADWB");
          reject(err);
        }

        log(`Successfully uploaded to: ${userWB + "@" + hostWB + ":" + pathWB + "/d01-outputs/"}`, "UPLOADWB", false);
        clientBrazil.close();
        deleteFile(pathCSV, "UPLOADWB");
        resolve();
      });
  } catch (error) {
    log(`Failed to transfer: ${path}`, "UPLOADWB", false);
    reject(error);
  }
});
