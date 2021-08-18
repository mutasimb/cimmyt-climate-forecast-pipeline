const
  express = require('express'),
  router = express.Router(),

  { timeParse } = require("d3-time-format"),
  fs = require('fs'),
  { promisify } = require('util'),
  readdir = promisify(fs.readdir),
  readFile = promisify(fs.readFile),

  { pathMungbean } = require('../config/keys'),
  
  callback = async (req, res) => {
    const { path } = req;

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
        res.json(path === "/ivr-developer/" ? dataJSON : {
          ...dataJSON,
          outgoing: dataJSON.outgoing.map(el => ({
            group: el.group,
            directives: el.directives,
            skipBroadcast: el.skipBroadcast ? true : false
          })),
          incoming: dataJSON.incoming.map(el => ({
            group: el.group,
            directives: el.directives
          }))
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

router.get('/ivr-provider/', callback);
router.get('/ivr-developer/', callback);
router.get('/ivr-archive/:ymd', async (req, res) => {
  const { ymd } = req.params;
  try {
    if(ymd && fs.existsSync(`${ pathMungbean + '/' }bmd_forecast_ivr_${ ymd }_d01.json`)) {
      res.json(JSON.parse(await readFile(`${ pathMungbean + '/' }bmd_forecast_ivr_${ ymd }_d01.json`)))
    } else {
      res.status(500).json({ err: "No data available" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
