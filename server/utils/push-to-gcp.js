const
  { join } = require('path'),
  { readFileSync } = require('fs'),
  { Client: SCPClient } = require('scp2'),

  log = require('./dev-log'),

  { hostGCP, userGCP, pathGCPKey, pathGCPOutput } = require('../config/keys');

module.exports = path => new Promise((resolve, reject) => {
  const clientGCP = new SCPClient({
    port: 22,
    host: hostGCP,
    username: userGCP,
    privateKey: readFileSync(join(__dirname, "..", pathGCPKey))
  });

  log(`Initiating upload to GCP: ${path}`, "UPLOADGCP", false);
  clientGCP.upload(
    path,
    pathGCPOutput + "/netcdf-d01-uploads/",
    err => {
      if (err) {
        log(`Upload failed: ${path}`, "UPLOADGCP", false);
        clientGCP.close();
        reject(err);
      }
      log(`Successfully uploaded to: ${userGCP + "@" + hostGCP + ":" + pathGCPOutput + "/netcdf-d01-uploads/"}`, "UPLOADGCP", false);
      clientGCP.close();
      resolve();
    });
});
