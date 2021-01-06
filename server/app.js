const
  { join } = require('path'),
  express = require('express'),
  cors = require('cors'),
  history = require('connect-history-api-fallback'),
  port = process.env.PORT || 5000,

  nc = require('./routes/nc'),
  mungbean = require('./routes/mungbean'),

  cronJobs = require('./utils/cron-jobs'),

  app = express();

app.use(history());
app.use(cors());

app.use('/api/nc', nc);
app.use('/api/mungbean', mungbean);

app.use(express.static(join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  cronJobs();
});
