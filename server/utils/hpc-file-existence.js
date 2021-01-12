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

  log(`Checking existence of remote file: ${path.join('/')}`, "BMDEXISTENCE");
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
            listOutput = await readdir(path[0]),
            dirYesterday = listOutput.find(el => el.filename === path[1]);
          if (!dirYesterday) throw new Error(`Directory doesn't exist: ${path.slice(0, 2).join('/')}`)

          const
            listDirYesterday = await readdir(path.slice(0, 2).join('/')),
            dir18 = listDirYesterday.find(el => el.filename === path[2]);
          if (!dir18) throw new Error(`Directory doesn't exist: ${path.slice(0, 3).join('/')}`)

          const
            listDir18 = await readdir(path.slice(0, 3).join('/')),
            fileDownloadable = listDir18.find(el => el.filename === path[3]);
          if (!fileDownloadable) throw new Error(`File doesn't exist: ${path.join('/')}`)

          log(`Remote file exists: ${path.join('/')}`, "BMDEXISTENCE");
          resolve();
        } catch (err) {
          log(`Remote file doesn't exist: ${path.join('/')}`, "BMDEXISTENCE CATCH");
          reject({ log: false, msg: err });
        } finally {
          connectionBMD.end();
        }
      });
    })
    .on('error', err => {
      log(`An error occurred: ${err}`, "BMDEXISTENCE CATCH", false);
      reject({ log: false, msg: err });
    })
    .connect({
      port: 22,
      host: hostBMD,
      username: userBMD,
      password: passBMD
    });
});
