const
  { Client: SSHClient } = require('ssh2'),
  { timeFormat } = require('d3-time-format'),

  log = require('./dev-log'),

  { hostBMD, userBMD, passBMD, pathBMDOutput } = require('../config/keys');

module.exports = () => new Promise((resolve, reject) => {
  const
    yyyymmddYesterday = timeFormat('%Y%m%d')(new Date(new Date().getTime() - 1000 * 3600 * 24)),
    filenameDownloadable = `${yyyymmddYesterday}18_d01.nc.subset`,
    path = [pathBMDOutput, yyyymmddYesterday, '18', filenameDownloadable],

    connectionBMD = new SSHClient();

  log(`Getting stats of remote file: ${path.join('/')}`, "BMDSTATS");
  connectionBMD
    .on('ready', () => {
      connectionBMD.sftp(async (err, sftp) => {
        if (err) throw err;
        const readdir = dir => new Promise((resolve, reject) => {
          sftp.readdir(dir, (err, list) => {
            if (err) return reject(err);
            resolve(list);
          });
        });

        try {
          const
            listDir18 = await readdir(path.slice(0, 3).join('/')),
            fileDownloadable = listDir18.find(el => el.filename === path[3]);
          if (!fileDownloadable) throw new Error(`File doesn't exist: ${path.join('/')}`);

          log(`Stats received: ${path.join('/')}`, "BMDSTATS");
          resolve(fileDownloadable);
        } catch (err) {
          log(`Failed to get stats: ${path.join('/')}`, "BMDSTATS CATCH");
          reject({ log: true, msg: err });
        } finally {
          connectionBMD.end();
        }
      });
    })
    .on('error', err => {
      log(`An error occurred: ${err}`, "BMDSTATS CATCH", false);
      reject({ log: false, msg: err });
    })
    .connect({
      port: 22,
      host: hostBMD,
      username: userBMD,
      password: passBMD
    });
});
