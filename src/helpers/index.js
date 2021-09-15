export const populate = (req) => {
  if (req.query.populate) {
    const p = req.query.populate.toLowerCase();
    if (p === '1' || p === 'true' || p === 'yes' || p === 'y') {
      return true;
    }
  }

  return false;
};

export const queryParam = (param) => {
  if (param) {
    const p = param.toLowerCase();
    if (p === '1' || p === 'true' || p === 'yes' || p === 'y') {
      return true;
    }
  }

  return false;
};
