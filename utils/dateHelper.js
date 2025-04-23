const dayjs = require('dayjs');

module.exports.toShortDate = (date) => {
  const input = dayjs(date);
  const now = dayjs();

  if (input.isSame(now, 'day')) {
    return input.format('HH:mm'); // just time if today
  }

  return input.format('DD MMM YYYY, HH:mm'); 
};
