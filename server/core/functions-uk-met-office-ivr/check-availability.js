const
  axios = require("axios"),

  log = require("../../utils/dev-log.js"),

  {
    apiOrderIdMetOfficeIVR: orderId,
    baseURLMetOffice: baseURL,
    clientIdMetOffice: clientId,
    clientSecretMetOffice: clientSecret
  } = require("../../config/keys.js");

module.exports = files => new Promise((resolve, reject) => {
  log("Checking whether new .grib2 files are available for downloading", "METOFFICEIVR_CHECKAVAILABILITY");
  axios({
    url: `/1.0.0/orders/${orderId}/latest`,
    method: "get",
    baseURL,
    headers: {
      'X-IBM-Client-Id': clientId,
      'X-IBM-Client-Secret': clientSecret,
      accept: 'application/json'
    },
    params: {
      detail: 'MINIMAL',
      runfilter: 'CURRENT'
    }
  }).then(res => {
    const
      resFiles = res.data.orderDetails.files,
      availability = files.map(
        file => !resFiles.find(el => el.fileId === file.fileId) ? null
          : ({ ...resFiles.find(el => el.fileId === file.fileId), ...file })
      );

    if (availability.indexOf(null) > -1) {
      reject({ message: "New files are not yet available to download, try again later", devOnly: true });
    } else {
      log("New files are available for downloading", "METOFFICEIVR_CHECKAVAILABILITY");
      resolve(availability);
    }
  }).catch(err => {
    reject(err);
  });
});
