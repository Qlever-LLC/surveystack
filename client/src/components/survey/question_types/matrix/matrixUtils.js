export const createRow = (fields, headers) => {
  // create empty row object from headers
  const newRow = Object.fromEntries(fields.map((field) => [field, { value: null }]));
  for (const key of Object.keys(newRow)) {
    const header = headers.find((h) => h.value === key);
    if (!header) {
      continue;
    }
    if (header.redacted) {
      newRow[key].meta = { permissions: ['admin'] };
    }
    newRow[key].value = header.defaultValue || null;
  }

  // const newRow2 = Object.fromEntries(fields.map(field => {
  //   const header = headers.find(h => h.value === field);
  //   const value = header ? header.defaultValue : null;
  //   const meta = header && header.redacted ? { permissions: ['admin'] } : undefined;
  //   return [field, { value, meta }];
  // }))

  return newRow;
};
