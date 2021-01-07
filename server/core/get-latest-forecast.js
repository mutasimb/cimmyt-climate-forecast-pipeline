const
  fs = require('fs'),
  { promisify } = require('util'),
  { timeFormat } = require('d3-time-format'),
  exists = promisify(fs.exists),
  stat = promisify(fs.stat),

  { ncPath, pathDownload } = require('../config/keys'),

  statsBMDDownloadable = require('../utils/hpc-file-stats.js'),
  checkBMDDownloadable = require('../utils/hpc-file-existence'),
  downloadBMDDownloadable = require('../utils/hpc-file-download'),
  processNc = require('../utils/process-downloaded-nc'),

  pushToGCP = require('../utils/push-to-gcp'),
  pushToWB = require('../utils/wheat-blast-push'),
  submitToEKrishok = require('../utils/e-krishok-submission'),

  log = require('../utils/dev-log');

module.exports = async () => {
  const
    yyyymmddToday = timeFormat('%Y%m%d')(new Date()),
    filenameProcessedNc = `bmd_forecast_${yyyymmddToday}_d01.nc`,
    pathProcessedNc = `${ncPath}/${filenameProcessedNc}`,

    yyyymmddYesterday = timeFormat('%Y%m%d')(new Date(new Date().getTime() - 1000 * 3600 * 24)),
    filenameDownloadable = `${yyyymmddYesterday}18_d01.nc.subset`,
    pathDownloaded = `${pathDownload}/${filenameDownloadable}`;

  try {
    log("", false, true, false);
    log("Initiating process ...", "ROOT");

    log("Checking existence of processed forecast output ...", "ROOT");
    const isProcessedNcPresent = await exists(pathProcessedNc);
    if (isProcessedNcPresent) throw { log: false, msg: `Processed forecast output file already exists: ${pathProcessedNc}` };
    log(`Processed forecast output file doesn't exist: ${pathProcessedNc}`, "ROOT");

    log("Checking existence of downloadable forecast file ...", "ROOT");
    const isDownloadedFilePresent = await exists(pathDownloaded);
    if (isDownloadedFilePresent) {
      log(`Downloadable forecast has been downloaded: ${pathDownloaded}`, "ROOT");

      log(`Getting stats of downloaded forecast file ...`, "ROOT");
      const stats = await stat(pathDownloaded);
      if ((new Date() - new Date(stats.mtimeMs)) / (1000 * 60) < 5) throw { log: true, msg: `File was modified less than 5 minute ago: ${pathDownloaded}` };

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

    const pathProcessedNcFile = await processNc(pathDownloaded);

    pushToGCP(pathProcessedNcFile.output).catch(err => { log(err, "ROOT", false, error = true); });
    pushToWB(pathProcessedNcFile.output).catch(err => { log(err, "ROOT", false, error = true); });
    submitToEKrishok(pathProcessedNcFile.output).catch(err => { log(err, "ROOT", false, error = true); });
  } catch (err) {
    if (err.log || process.env.NODE_ENV === "development") log('msg' in err ? err.msg : err, "ROOT CATCH", false, error = true);
  }
};
