const
  { join } = require('path'),
  { spawn } = require('child_process'),

  { pythonExecutable } = require("../../config/keys.js"),
  pathPyScript = join(__dirname, "grib-to-json.py"),

  uint8arrayToString = data => String.fromCharCode.apply(null, data);

module.exports = ({
  pathGribDir,
  filenameGrib,
  pathOutputDir,
  filenameOutput
}) => new Promise((resolve, reject) => {
  const scriptExecution = spawn(pythonExecutable, [
    pathPyScript,
    pathGribDir,
    filenameGrib,
    pathOutputDir,
    filenameOutput
  ]);

  scriptExecution.stdout.on('data', data => {
    if (uint8arrayToString(data).includes("Python script successfully run")) resolve({
      message: "JSON file created",
      path: pathOutputDir + filenameOutput
    });
  });

  scriptExecution.stderr.on('data', data => {
    reject({
      message: uint8arrayToString(data)
    });
  });
});
