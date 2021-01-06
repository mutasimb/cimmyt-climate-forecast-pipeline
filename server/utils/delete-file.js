const
  { existsSync, unlinkSync } = require('fs'),
  log = require('./dev-log');

module.export = (path, moduleName) => {
  if (existsSync(path)) {
    unlinkSync(path);
    log(`File deleted from local computer: ${path}`, moduleName, false);
  }
};
