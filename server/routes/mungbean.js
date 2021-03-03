const
  express = require('express'),
  router = express.Router(),

  { timeParse } = require("d3-time-format"),
  fs = require('fs'),
  { promisify } = require('util'),
  readdir = promisify(fs.readdir),
  readFile = promisify(fs.readFile),

  { pathMungbean } = require('../config/keys');

router.get('/ivr-provider/', async (req, res) => {
  try {
    const
      mungbeanFiles = await readdir(pathMungbean),
      mungbeanDirectives = mungbeanFiles
        .filter(el => el.startsWith("bmd_forecast_ivr_"))
        .map(el => ({
          filename: el,
          path: pathMungbean + '/' + el,
          date: timeParse("bmd_forecast_ivr_%Y%m%d_d01.json")(el)
        }))
        .sort((a, b) => a.date > b.date ? -1 : 1);
    if(mungbeanDirectives.length === 0) {
      res.status(503).json({
        message: "No data available"
      });
    } else {
      const dataJSON = JSON.parse(await readFile(mungbeanDirectives[0].path));
      res.json(dataJSON);
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
