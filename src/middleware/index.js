export const assertSuperAdmin = (req, res, next) => {
  if (!res.locals.auth.isSuperAdmin) {
    return res.status(403).send('Need to be super-admin.');
  }
  next();
};

export const assertAuthenticated = (req, res, next) => {
  if (!res.locals.auth.isAuthenticated) {
    return res.status(403).send('Need to be authenticated.');
  }
  next();
};
