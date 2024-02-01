export const catchErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err, _req, res, _next) => {
  if (err.isBoom) {
    res.status(err?.output?.statusCode ?? 500).json({ message: err.message });
    return;
  }
  const status = err?.status ?? 500;
  if (err?.status && err?.message) {
    res.status(status).json({
      message: err?.message,
      errors: err?.errors,
    });
    return;
  }
  // log errors during development and in production
  // but, do not log them during testing as it pollutes the test output
  if (process.env.NODE_ENV !== 'test') {
    console.log('Unhandled Error:', err);
  }
  res.status(status).send();
};

export { catchErrors, errorHandler };
