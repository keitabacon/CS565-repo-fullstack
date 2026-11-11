const { body, validationResult } = require('express-validator');
const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

// Display list of all BookInstances.
exports.bookinstance_list = async (req, res) => {
  const allBookInstances = await BookInstance.find().populate('book').exec();

  return res.render('bookinstance_list', {
    title: 'Book Instance List',
    bookinstance_list: allBookInstances,
  });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate('book').exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error('Book copy not found');
    err.status = 404;
    return next(err);
  }

  return res.render('bookinstance_detail', {
    title: 'Book:',
    bookinstance: bookInstance,
  });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = async (req, res) => {
  const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();

  return res.render('bookinstance_form', {
    title: 'Create BookInstance',
    book_list: allBooks,
  });
};
// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ values: 'falsy' }).isISO8601().toDate(),

  // Process request after validation and sanitization.
  async (req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();

      return res.render('bookinstance_form', {
        title: 'Create BookInstance',
        book_list: allBooks,
        selected_book: bookInstance.book.id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
    }

    // Data from form is valid
    await bookInstance.save();
    return res.redirect(bookInstance.url);
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = async (req, res, next) => {
  try {
    const bookinstance = await BookInstance.findById(req.params.id).populate('book').exec();
    if (!bookinstance) return res.redirect('/catalog/bookinstances');
    return res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance });
  } catch (err) {
    return next(err);
  }
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = async (req, res, next) => {
  try {
    await BookInstance.findByIdAndDelete(req.params.id);
    return res.redirect('/catalog/bookinstances');
  } catch (err) {
    return next(err);
  }
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = async (req, res, next) => {
  try {
    const record = await BookInstance.findById(req.params.id).exec();
    if (!record) {
      const err = new Error('BookInstance not found');
      err.status = 404;
      return next(err);
    }
    const bookList = await Book.find({}, 'title').sort({ title: 1 }).exec();
    return res.render('bookinstance_form', {
      title: 'Update BookInstance',
      bookinstance: record,
      book_list: bookList,
      selected_book: record.book.toString(),
    });
  } catch (err) {
    return next(err);
  }
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body('book')
    .isMongoId()
    .withMessage('Select a valid book.')
    .bail()
    .custom(async (id) => {
      if (!(await Book.exists({ _id: id }))) throw new Error('Selected book does not exist.');
    }),
  body('imprint').trim().notEmpty().withMessage('Imprint is required.'),
  body('status')
    .isIn(['Available', 'Maintenance', 'Loaned', 'Reserved'])
    .withMessage('Select a valid status.'),
  body('due_back')
    .optional({ values: 'falsy' })
    .isISO8601({ strict: true })
    .withMessage('Invalid due date')
    .toDate(),
  async (req, res, next) => {
    try {
      const existing = await BookInstance.findById(req.params.id).exec();
      if (!existing) {
        const err = new Error('BookInstance not found');
        err.status = 404;
        return next(err);
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const submitted = { ...req.body, _id: req.params.id };
        submitted.due_back_yyyy_mm_dd = '';
        if (typeof req.body.due_back === 'string') {
          submitted.due_back_yyyy_mm_dd = req.body.due_back;
        } else if (
          req.body.due_back instanceof Date &&
          !Number.isNaN(req.body.due_back.getTime())
        ) {
          submitted.due_back_yyyy_mm_dd = req.body.due_back.toISOString().slice(0, 10);
        }
        const bookList = await Book.find({}, 'title').sort({ title: 1 }).exec();
        return res.render('bookinstance_form', {
          title: 'Update BookInstance',
          bookinstance: submitted,
          errors: errors.array(),
          book_list: bookList,
          selected_book: req.body.book,
        });
      }
      const updated = await BookInstance.findByIdAndUpdate(
        req.params.id,
        {
          book: req.body.book,
          imprint: req.body.imprint,
          status: req.body.status,
          due_back: req.body.due_back || null,
        },
        { runValidators: true, new: true }
      );
      if (!updated) {
        const err = new Error('BookInstance not found');
        err.status = 404;
        return next(err);
      }
      return res.redirect(updated.url);
    } catch (err) {
      return next(err);
    }
  },
];
