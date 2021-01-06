const
  express = require('express'),
  router = express.Router(),
  R = require('../utils/r-script'),

  { ncPath } = require('../config/keys');

router.get('/list', async (req, res) => {
  try {
    const outputR = await R("server/r-scripts/list-files.R", { r_input_path_nc: ncPath });
    res.json(outputR);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/area-points', async (req, res) => {
  const { file, ln1, ln2, lt1, lt2 } = req.query;
  try {
    const outputR = await R(
      "server/r-scripts/area-points.R",
      {
        r_input_path_nc: ncPath,
        r_input_filename: file,
        r_input_ln1: +ln1,
        r_input_ln2: +ln2,
        r_input_lt1: +lt1,
        r_input_lt2: +lt2
      }
    );
    res.json(outputR);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/point-forecast', async (req, res) => {
  const { file, iLon, iLat } = req.query;
  try {
    const outputR = await R(
      "server/r-scripts/point-data.R",
      {
        r_input_path_nc: ncPath,
        r_input_filename: file,
        r_input_lon_index: +iLon,
        r_input_lat_index: +iLat
      }
    );
    res.json(outputR);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
