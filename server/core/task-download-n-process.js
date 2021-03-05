const
  fs = require('fs'),
  { promisify } = require('util'),
  { timeFormat } = require('d3-time-format'),
  writeFile = promisify(fs.writeFile),
  readFile = promisify(fs.readFile),
  exists = promisify(fs.exists),
  stat = promisify(fs.stat),

  { pathDateLog, pathDownload } = require('../config/keys'),

  statsBMDDownloadable = require('../utils/hpc-file-stats.js'),
  checkBMDDownloadable = require('../utils/hpc-file-existence'),
  downloadBMDDownloadable = require('../utils/hpc-file-download'),

  bmdToGCP = require('./forecast-to-GCP'),
  bmdToIVR = require('./forecast-to-IVR'),
  bmdToEKrishok = require('./forecast-to-ekrishok'),
  bmdToWB = require('./forecast-to-wheat-blast'),

  log = require('../utils/dev-log');

module.exports = async () => {
  const
    yyyymmddToday = timeFormat('%Y%m%d')(new Date()),
    yyyymmddYesterday = timeFormat('%Y%m%d')(new Date(new Date().getTime() - 1000 * 3600 * 24)),

    filenameDownloadable = `${yyyymmddYesterday}18_d01.nc.subset`,
    pathDownloaded = `${pathDownload}/${filenameDownloadable}`;

  try {
    log("", false, true, false);
    log("Initiating process ...", "ROOT", true);

    const
      dateLogExists = await exists(pathDateLog);
    let
      dateLog = dateLogExists ? JSON.parse(await readFile(pathDateLog)) : { date: 0 };

    if(!dateLogExists || dateLog.date !== +yyyymmddToday) await writeFile(pathDateLog, JSON.stringify({
      date: +yyyymmddToday,
      createdAt: new Date(),
      agvisely: { done: false, updatedAt: null },
      wheatBlast: { done: false, updatedAt: null },
      eKrishok: { done: false, updatedAt: null },
      ivr: { done: false, updatedAt: null }
    }, undefined, 2));
    dateLog = JSON.parse(await readFile(pathDateLog));

    log("Checking existence of downloadable forecast file ...", "ROOT");
    const isDownloadedFilePresent = await exists(pathDownloaded);
    if (isDownloadedFilePresent) {
      log(`Downloadable forecast has been downloaded: ${pathDownloaded}`, "ROOT");

      log(`Getting stats of downloaded forecast file ...`, "ROOT");
      const stats = await stat(pathDownloaded);
      if (
        (new Date() - new Date(stats.mtimeMs)) / (1000 * 60) < 5
      ) throw { log: true, msg: `File was modified less than 5 minute ago: ${pathDownloaded}` };

      const
        { size: sizeDownloadedFile } = stats,
        { attrs } = await statsBMDDownloadable(),
        { size: sizeRemoteFile } = attrs;

      if (sizeDownloadedFile !== sizeRemoteFile) {
        log("But downloaded file size doesn't match the remote file", "ROOT");
        log("Attempt to download again ...", "ROOT");
        await downloadBMDDownloadable();
      }
    } else {
      log(`Downloadable forecast hasn't been downloaded: ${pathDownloaded}`, "ROOT");
      await checkBMDDownloadable();
      await downloadBMDDownloadable();
    }

    if(!dateLog.agvisely.done) await bmdToGCP(pathDownloaded);
    if(!dateLog.ivr.done) await bmdToIVR(pathDownloaded);
    if(!dateLog.eKrishok.done) await bmdToEKrishok(pathDownloaded);
    if(!dateLog.wheatBlast.done) await bmdToWB(pathDownloaded);
  } catch (err) {
    if (err.log || process.env.NODE_ENV === "development") log('msg' in err ? err.msg : err, "ROOT CATCH", false, error = true);
  } finally {
    log("... finished", "ROOT", true);
  }
};
