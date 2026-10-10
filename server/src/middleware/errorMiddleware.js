export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Formulate consistent client response without leaking raw internal stack traces
  const response = {
    success: false,
    message: err.message || 'An unexpected internal server error occurred',
  };

  if (err.validationErrors && Array.isArray(err.validationErrors)) {
    response.errors = err.validationErrors;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    response.message = `Resource not found: Invalid ${err.path}`;
    return res.status(404).json(response);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    response.message = messages.join('; ');
    return res.status(400).json(response);
  }

  // Handle Mongo duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    response.message = `Duplicate value entered for ${field}. Please use another value.`;
    return res.status(409).json(response);
  }

  res.status(statusCode).json(response);
};
