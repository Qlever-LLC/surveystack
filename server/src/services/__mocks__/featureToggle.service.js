// Turn on all feature toggles for the tests

export const unleashProxyApp = (_, __, next) => next();

export const isToggleOn = async (_toggleName, _userId) => {
  return true;
};

export const toggleMiddleware = (req, res, next) => {
  res.locals.isToggleOn = (featureName) => isToggleOn(featureName);
  next();
};
