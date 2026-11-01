const { body, validationResult } = require('express-validator');
const Genre = require('../models/genre');
const Book = require('../models/book');

// Display list of all Genre.
exports.genre_list = async (req, res, next) => {
  try {
    const allGenres = await Genre.find().sort({ name: 1 }).exec();
    return res.render('genre_list', {
      title: 'Genre List',
      genre_list: allGenres,
    });
  } catch (err) {
    return next(err);
  }
};

// Display detail page for a specific Genre.
exports.genre_detail = async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, 'title summary').exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error('Genre not found');
    err.status = 404;
    return next(err);
  }

  return res.render('genre_detail', {
    title: 'Genre Detail',
    genre,
    genre_books: booksInGenre,
  });
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => res.render('genre_form', { title: 'Create Genre' });

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body('name', 'Genre name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  async (req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      return res.render('genre_form', {
        title: 'Create Genre',
        genre,
        errors: errors.array(),
      });
    }

    // Data from form is valid.
    // Check if Genre with same name already exists.
    const genreExists = await Genre.findOne({ name: req.body.name })
      .collation({ locale: 'en', strength: 2 })
      .exec();
    if (genreExists) {
      // Genre exists, redirect to its detail page.
      return res.redirect(genreExists.url);
    }

    // New genre. Save and redirect to its detail page.
    await genre.save();
    return res.redirect(genre.url);
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = async (req, res, next) => {
  try {
    const [genre, dependencies] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }).exec(),
    ]);
    if (!genre) return res.redirect('/catalog/genres');
    return res.render('genre_delete', {
      title: 'Delete Genre',
      genre,
      genre_books: dependencies,
    });
  } catch (err) {
    return next(err);
  }
};

// Handle Genre delete on POST.
exports.genre_delete_post = async (req, res, next) => {
  try {
    const [genre, dependencies] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({ genre: req.params.id }).exec(),
    ]);
    if (!genre) return res.redirect('/catalog/genres');
    if (dependencies.length === 0) {
      await Genre.findByIdAndDelete(req.params.id);
      return res.redirect('/catalog/genres');
    }
    return res.render('genre_delete', {
      title: 'Delete Genre',
      genre,
      genre_books: dependencies,
    });
  } catch (err) {
    return next(err);
  }
};

// Display Genre update form on GET.
exports.genre_update_get = async (req, res, next) => {
  try {
    const record = await Genre.findById(req.params.id).exec();
    if (!record) {
      const err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    return res.render('genre_form', { title: 'Update Genre', genre: record });
  } catch (err) {
    return next(err);
  }
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Genre name must contain 3 to 100 characters.'),
  async (req, res, next) => {
    try {
      const existing = await Genre.findById(req.params.id).exec();
      if (!existing) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const submitted = { ...req.body, _id: req.params.id };
        return res.render('genre_form', {
          title: 'Update Genre',
          genre: submitted,
          errors: errors.array(),
        });
      }
      const updated = await Genre.findByIdAndUpdate(
        req.params.id,
        { name: req.body.name },
        { runValidators: true, new: true }
      );
      if (!updated) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      return res.redirect(updated.url);
    } catch (err) {
      return next(err);
    }
  },
];
