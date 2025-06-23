const { body, validationResult } = require('express-validator');

const registerValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ];
};

const loginValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
  });
};

module.exports = {
  registerValidationRules,
  loginValidationRules,
  validate,
  taskValidationRules: () => {
    return [
      body('title')
        .notEmpty().withMessage('Title is required')
        .trim(),
      body('description')
        .optional()
        .trim(),
      body('status')
        .optional()
        .isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status. Must be pending, in-progress, or completed.'),
      body('dueDate')
        .optional({ checkFalsy: true }) // Allow null or empty string to be considered optional
        .isISO8601().withMessage('Due date must be a valid date (YYYY-MM-DD)')
        .toDate(), // Sanitizer to convert to Date object
    ];
  },
  updateProfileValidationRules: () => {
    return [
      body('name')
        .optional()
        .isString().withMessage('Name must be a string')
        .trim(),
      body('email')
        .optional()
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(), // Sanitizer
      // For password updates, newPassword and currentPassword are often handled together
      // If newPassword is provided, currentPassword should also be provided.
      body('newPassword')
        .optional()
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
      // currentPassword validation is tricky here because it's only needed if newPassword is provided.
      // This might be better handled in the route logic or with a custom validator.
      // For now, we ensure it's a string if provided. The route will check if it's required.
      body('currentPassword')
        .optional()
        .isString().withMessage('Current password must be a string if provided'),
    ];
  }
};
