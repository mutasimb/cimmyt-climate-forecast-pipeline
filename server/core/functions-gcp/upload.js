const
  { join } = require('path'),
  { readFileSync } = require('fs'),
  { Client: SCPClient } = require('scp2'),

  log = require('../../utils/dev-log.js'),

  {
    portAgvisely,
    hostAgvisely,
    userAgvisely,
    pathAgviselyKey,
    pathAgviselyOutput
  } = require('../../config/keys.js');

module.exports = path => new Promise((resolve, reject) => {
  const clientAgvisely = new SCPClient({
    port: portAgvisely,
    host: hostAgvisely,
    username: userAgvisely,
    privateKey: readFileSync(join(__dirname, "..", "..", pathAgviselyKey))
  });

  log("Initiating upload to Agvisely server", "AGVISELY_UPLOAD");
  clientAgvisely.upload(
    path,
    pathAgviselyOutput,
    err => {
      if (err) {
        log("Upload failed", "AGVISELY_UPLOAD");
        clientAgvisely.close();
        reject(err);
      }
      log("Successfully uploaded", "AGVISELY_UPLOAD");
      clientAgvisely.close();
      resolve();
    }
  );
});
