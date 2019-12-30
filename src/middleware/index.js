export const assertAdmin = (req, res, next) => {
  if (!res.locals.auth.isAdmin) {
    return res.status(403).send("Need to be admin.");
  }
  next();
};

export const assertAuthenticated = (req, res, next) => {
  if (!res.locals.auth.isAuthenticated) {
    return res.status(403).send("Need to be authenticated.");
  }
  next();
};
