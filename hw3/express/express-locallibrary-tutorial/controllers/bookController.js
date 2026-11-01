const { body, validationResult } = require('express-validator');
const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

exports.index = async (req, res) => {
  // Get details of books, book instances, authors and genre counts (in parallel)
  const [numBooks, numBookInstances, numAvailableBookInstances, numAuthors, numGenres] =
    await Promise.all([
      Book.countDocuments({}).exec(),
      BookInstance.countDocuments({}).exec(),
      BookInstance.countDocuments({ status: 'Available' }).exec(),
      Author.countDocuments({}).exec(),
      Genre.countDocuments({}).exec(),
    ]);

  return res.render('index', {
    title: 'Local Library Home',
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
};

// Display list of all books.
exports.book_list = async (req, res) => {
  const allBooks = await Book.find({}, 'title author').sort({ title: 1 }).populate('author').exec();

  return res.render('book_list', { title: 'Book List', book_list: allBooks });
};

// Display detail page for a specific book.
exports.book_detail = async (req, res, next) => {
  // Get details of books, book instances for specific book
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate('author').populate('genre').exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  if (book === null) {
    // No results.
    const err = new Error('Book not found');
    err.status = 404;
    return next(err);
  }

  return res.render('book_detail', {
    title: book.title,
    book,
    book_instances: bookInstances,
  });
};

// Display book create form on GET.
exports.book_create_get = async (req, res) => {
  // Get all authors and genres, which we can use for adding to our book.
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);

  return res.render('book_form', {
    title: 'Create Book',
    authors: allAuthors,
    genres: allGenres,
  });
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
    }
    return next();
  },

  // Validate and sanitize fields.
  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),
  // Process request after validation and sanitization.

  async (req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      // Mark our selected genres as checked.

      return res.render('book_form', {
        title: 'Create Book',
        authors: allAuthors,
        genres: allGenres.map((genre) => ({
          ...genre.toObject({ virtuals: true }),
          checked: book.genre.includes(genre.id),
        })),
        book,
        errors: errors.array(),
      });
    }

    // Data from form is valid. Save book.
    await book.save();
    return res.redirect(book.url);
  },
];
// Display book update form on GET.
exports.book_update_get = async (req, res, next) => {
  // Get book, authors and genres for form.
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate('author').exec(),
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);

  if (book === null) {
    // No results.
    const err = new Error('Book not found');
    err.status = 404;
    return next(err);
  }

  // Mark our selected genres as checked.

  return res.render('book_form', {
    title: 'Update Book',
    authors: allAuthors,
    genres: allGenres.map((genre) => ({
      ...genre.toObject({ virtuals: true }),
      checked: book.genre.includes(genre.id),
    })),
    book,
  });
};

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
    }
    return next();
  },

  // Validate and sanitize fields.
  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  // Process request after validation and sanitization.
  async (req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      // Mark our selected genres as checked.

      return res.render('book_form', {
        title: 'Update Book',
        authors: allAuthors,
        genres: allGenres.map((genre) => ({
          ...genre.toObject({ virtuals: true }),
          checked: book.genre.includes(genre.id),
        })),
        book,
        errors: errors.array(),
      });
    }

    // Data from form is valid. Update the record.
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
    // Redirect to book detail page.
    return res.redirect(updatedBook.url);
  },
];

exports.book_delete_get = async (req, res, next) => {
  try {
    const [book, dependencies] = await Promise.all([
      Book.findById(req.params.id).exec(),
      BookInstance.find({ book: req.params.id }).exec(),
    ]);
    if (!book) return res.redirect('/catalog/books');
    return res.render('book_delete', {
      title: 'Delete Book',
      book,
      book_instances: dependencies,
    });
  } catch (err) {
    return next(err);
  }
};

exports.book_delete_post = async (req, res, next) => {
  try {
    const [book, dependencies] = await Promise.all([
      Book.findById(req.params.id).exec(),
      BookInstance.find({ book: req.params.id }).exec(),
    ]);
    if (!book) return res.redirect('/catalog/books');
    if (dependencies.length === 0) {
      await Book.findByIdAndDelete(req.params.id);
      return res.redirect('/catalog/books');
    }
    return res.render('book_delete', {
      title: 'Delete Book',
      book,
      book_instances: dependencies,
    });
  } catch (err) {
    return next(err);
  }
};
