const R = require('r-script');

module.exports = (script, data) => new Promise((resolve, reject) => {
  R(script).data(data).call((err, d) => {
    if (err) reject(err.toString());
    resolve(JSON.parse(d));
  })
});
