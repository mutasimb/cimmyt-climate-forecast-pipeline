module.exports = () => {
  const
    today = new Date(),
    tomorrow = new Date();

  tomorrow.setDate(today.getDate() + 1);

  return today.getHours() >= 22 ? tomorrow : today;
};
