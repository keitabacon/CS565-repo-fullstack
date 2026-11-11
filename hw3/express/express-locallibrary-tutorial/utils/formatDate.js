const { DateTime } = require('luxon');

module.exports = function formatDate(date) {
  if (!date) return '';

  const value = DateTime.fromJSDate(date, { zone: 'utc' }).setLocale('en-US');
  if (!value.isValid) return '';

  const { day } = value;
  const suffix =
    day % 100 >= 11 && day % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th';

  return `${value.toFormat('LLL')} ${day}${suffix}, ${value.year}`;
};
