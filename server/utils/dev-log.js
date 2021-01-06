const { timeFormat } = require('d3-time-format');

module.exports = (str, script = '', devOnly = true, timestamp = true, error = false) => {
  let log = '';
  if (timestamp) log = log + timeFormat("[%x %X]")(new Date());
  if (script) log = log + `[${script}]`;
  log = log + " " + str;

  if (devOnly) {
    if (process.env.NODE_ENV === 'development') {
      if (error) { console.error(log); } else { console.log(log); }
    }
  } else {
    if (error) { console.error(log); } else { console.log(log); }
  }
};
