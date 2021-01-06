const
  express = require('express'),
  router = express.Router(),

  forecastEKrishok = require('../utils/e-krishok-forecast');

router.get('/', async (req, res) => {
  try {
    const forecast = await forecastEKrishok();
    res.json(forecast);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
