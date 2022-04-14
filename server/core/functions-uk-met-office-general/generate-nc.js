const
  { join } = require("path"),

  log = require("../../utils/dev-log.js"),

  R = require("../../utils/r-script.js");

module.exports = ({ date, pathsJSON, pathNC }) =>
  new Promise((resolve, reject) => {
    log("Generating output .nc file from .json files", "METOFFICEGENERAL_GENERATENETCDF");
    R(
      join(__dirname, "generate-nc.R"),
      {
        r_input_date_str: date,
        r_input_paths_json: pathsJSON,
        r_input_path_netcdf: pathNC
      }
    ).then(res => {
      log(".nc file generated", "METOFFICEGENERAL_GENERATENETCDF");
      resolve(res.message);
    }).catch(err => {
      log("Failed to generate .nc file", "METOFFICEGENERAL_GENERATENETCDF", false, true, true);
      reject(err);
    })
  });
