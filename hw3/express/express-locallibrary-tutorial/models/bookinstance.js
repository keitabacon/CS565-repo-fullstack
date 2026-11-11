const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const formatDate = require('../utils/formatDate');

const { Schema } = mongoose;

const BookInstanceSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true }, // reference to the associated book
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
    default: 'Maintenance',
  },
  due_back: { type: Date, default: Date.now },
});

// Virtual for bookinstance's URL
BookInstanceSchema.virtual('url').get(function url() {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/bookinstance/${this.id}`;
});

BookInstanceSchema.virtual('due_back_formatted').get(function dueBackFormatted() {
  return formatDate(this.due_back);
});

BookInstanceSchema.virtual('due_back_yyyy_mm_dd').get(function dueBackYyyyMmDd() {
  if (!this.due_back) return '';
  const date = DateTime.fromJSDate(this.due_back, { zone: 'utc' });
  return date.isValid ? date.toISODate() : '';
});

// Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);
