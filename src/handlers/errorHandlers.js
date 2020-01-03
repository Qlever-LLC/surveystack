import boom from '@hapi/boom';

export const catchErrors = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    if (!err.isBoom) {
      return next(boom.badImplementation(err));
    }
    next(err);
  });
};

export const notFound = (req, res, next) => {
  next(boom.notFound());
};

export const developmentErrors = (err, req, res, next) => {
  res.status(err.output.statusCode).json({ message: err.message });
};

export const productionErrors = (err, req, res, next) => {
  res.status(err.output.statusCode).json(err.output.payload);
};

export default {
  catchErrors,
  notFound,
  developmentErrors,
  productionErrors,
};
