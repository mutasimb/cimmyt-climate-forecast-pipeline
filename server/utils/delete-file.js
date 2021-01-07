const
  { existsSync, unlinkSync } = require('fs'),

  { NODE_ENV } = process.env,

  log = require('./dev-log');

module.export = (path, moduleName) => {
  if (existsSync(path) && NODE_ENV === 'production') {
    unlinkSync(path);
    log(`File deleted from local computer: ${path}`, moduleName, false);
  }
};
