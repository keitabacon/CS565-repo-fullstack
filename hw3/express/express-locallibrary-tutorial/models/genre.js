const mongoose = require('mongoose');

const { Schema } = mongoose;

const GenreSchema = new Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 100 },
});

GenreSchema.virtual('url').get(function url() {
  return `/catalog/genre/${this.id}`;
});

module.exports = mongoose.model('Genre', GenreSchema);
