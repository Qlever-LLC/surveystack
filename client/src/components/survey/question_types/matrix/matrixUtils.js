export const createRow = (fields, headers) => {
  // create empty row object from headers
  const newRow = Object.fromEntries(
    fields.map((field) => {
      const header = headers.find((h) => h.value === field);
      const value = (header && header.defaultValue) || null;
      const meta = header && header.redacted ? { permissions: ['admin'] } : undefined;
      return [field, { value, meta }];
    })
  );

  return newRow;
};
