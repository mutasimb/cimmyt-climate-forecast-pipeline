const
  { unlinkSync } = require('fs'),
  { Client: SCPClient } = require('scp2'),
  { timeFormat } = require('d3-time-format'),

  { hostBMD, userBMD, passBMD, pathBMDOutput, pathDownload } = require('../config/keys'),

  log = require('./dev-log');

module.exports = () => new Promise((resolve, reject) => {
  const
    yyyymmddYesterday = timeFormat('%Y%m%d')(new Date(new Date().getTime() - 1000 * 3600 * 24)),
    filenameDownloadable = `${yyyymmddYesterday}18_d01.nc.subset`,
    pathRemote = [pathBMDOutput, yyyymmddYesterday, '18', filenameDownloadable],
    pathLocal = [pathDownload, filenameDownloadable],

    clientBMD = new SCPClient({
      port: 22,
      host: hostBMD,
      username: userBMD,
      password: passBMD
    });

  log(`Initiating download: ${userBMD + '@' + hostBMD}:${pathRemote.join('/')}`, "BMDDOWNLOAD", false);
  clientBMD.download(
    pathRemote.join('/'),
    pathLocal.join('/'),
    err => {
      if (err) {
        setTimeout(() => {
          log(`Failed to download: ${pathRemote.join('/')}`, "BMDDOWNLOAD", false);
          unlinkSync(pathLocal.join('/'));
          clientBMD.close();
          reject({ log: true, msg: err });
        }, 15 * 1000);
      } else {
        log(`Download finished: ${pathLocal.join('/')}`, "BMDDOWNLOAD", false);
        clientBMD.close();
        resolve(pathLocal.join('/'));
      }
    }
  );
});
