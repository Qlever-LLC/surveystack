import boom from '@hapi/boom';

export const catchErrors = (fn, hook) => (req, res, next) => {
  Promise.resolve(fn(req, res, next, hook)).catch((err) => {
    console.log(err);
    if (!err.isBoom) {
      return next(boom.badImplementation(err));
    }
    next(err);
  });
};

export const notFound = (_req, _res, next) => {
  next(boom.notFound());
};

export const developmentErrors = (err, _req, res, _next) => {
  console.log('Calling development Errors');
  res.status((err.output && err.output.statusCode) || 500).json({ message: err.message });
};

export const productionErrors = (err, _req, res, _next) => {
  res
    .status((err.output && err.output.statusCode) || 500)
    .json((err && err.output && err.output.payload) || err);
};

export default {
  catchErrors,
  notFound,
  developmentErrors,
  productionErrors,
};
