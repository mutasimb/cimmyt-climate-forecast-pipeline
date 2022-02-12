const
  { promisify } = require("util"),
  exec = promisify(require("child_process").exec),
  axios = require("axios"),

  log = require("../../utils/dev-log.js"),

  {
    apiOrderIdMetOfficeGeneral: orderId,
    baseURLMetOffice: baseURL,
    clientIdMetOffice: clientId,
    clientSecretMetOffice: clientSecret
  } = require("../../config/keys.js");

module.exports = files => new Promise((resolve, reject) => {
  let filesData;

  log("Getting timestep metadata", "METOFFICEGENERAL_DOWNLOADFILES");
  Promise.all(
    files.map(el => axios({
      url: `/1.0.0/orders/${orderId}/latest/${el.fileId}`,
      method: "get",
      baseURL,
      headers: {
        'X-IBM-Client-Id': clientId,
        'X-IBM-Client-Secret': clientSecret,
        accept: 'application/json'
      }
    }))
  )
    .then(res => {
      filesData = res.map((el, i) => {
        const
          { parameterId: param, extent } = el.data.fileDetails.parameterDetails[0],
          { t: timesteps } = extent;

        return { ...files[i], param, timesteps };
      });

      log("Attempting to download new .grib2 files", "METOFFICEGENERAL_DOWNLOADFILES");
      const
        curlURL = ({ baseURL, orderId, fileId }) => '--url "' + baseURL + '/1.0.0/orders/' + orderId + '/latest/' + fileId + '/data"',
        curlH1 = '--header "Accept: application/x-grib"',
        curlH2 = '--header "X-IBM-Client-Id: ' + clientId + '"',
        curlH3 = '--header "X-IBM-Client-Secret: ' + clientSecret + '"',
        curlOutput = path => '--output "' + path + '"';

      return Promise.all(filesData.map(el => exec(
        `curl --request GET ${curlURL({ baseURL, orderId, fileId: el.fileId })
        } ${curlH1} ${curlH2} ${curlH3} ${curlOutput(el.path)
        } --location`
      )));
    })
    .then(() => {
      log("New .grib2 files downloaded", "METOFFICEGENERAL_DOWNLOADFILES");
      resolve(filesData);
    })
    .catch(err => {
      reject(err);
    })
});
