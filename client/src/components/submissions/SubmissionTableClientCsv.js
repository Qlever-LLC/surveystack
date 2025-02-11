import parseISO from 'date-fns/parseISO';
import isValid from 'date-fns/isValid';
import format from 'date-fns/format';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';

const PREFERRED_HEADERS = ['_id', 'meta.creatorDetail.name', 'meta.dateSubmitted', 'meta.archived'];

function matrixHeadersFromSubmission(submission, parentKey = '') {
  const headers = [];
  Object.entries(submission.data || {}).forEach(([key, value]) => {
    const type = typeof value.meta === 'object' ? value.meta.type : '';
    if (type === 'page' || type === 'group') {
      const data = cloneDeep(omit(value, 'meta'));
      headers.push(...matrixHeadersFromSubmission({ data }, key));
    } else if (type === 'matrix') {
      headers.push(`data${parentKey ? `.${parentKey}` : ''}.${key}.value`);
    }
  });
  return headers;
}

function transformMatrixHeaders(headers, submissions) {
  // Get matrix headers from submissions raw data by filtering "meta.type" = "matrix"
  let matrixHeaders = [];
  submissions.forEach((submission) => {
    matrixHeaders = [...new Set([...matrixHeaders, ...matrixHeadersFromSubmission(submission)])];
  });

  const result = [];
  headers.forEach((header) => {
    const matched = matrixHeaders.find((h) => header.startsWith(h));
    if (!matched) {
      result.push(header);
    } else if (!result.includes(matched)) {
      result.push(matched);
    }
  });

  return result;
}

function getCellValue(item, index, header) {
  const value = typeof item === 'string' ? item : typeof item[header] === 'string' ? item[header] : null;
  const isoDateRegex = /^(\d{4}-\d{2}-\d{2}([T\s](\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2})))?)?)?$/;

  // Parse date
  if (value == null || value === '') {
    return ' ';
  } else if (!isoDateRegex.test(value)) {
    return value;
  } else {
    let parsedDate = parseISO(value);
    if (index < PREFERRED_HEADERS.length && isValid(parsedDate) && parsedDate.toISOString() === value) {
      // In PREFERRED_HEADERS dateSubmitted is displayed depending on the user's time zone.
      return format(parsedDate, 'MMM d, yyyy h:mm a');
    } else if (isValid(parsedDate)) {
      // In the results of the survey for the date types, we are only interested in days and not hours. We avoid timezone modifications: June 1, 2024 is June 1. 2024 anywhere
      // extract YYYY-MM-DD from YYYY-MM-DDTHH:mm:ss.sssZ
      const date = value.slice(0, 10);
      parsedDate = parseISO(date);
      return format(parsedDate, 'MMM d, yyyy');
    } else {
      return value;
    }
  }
}

function getPropertiesFromMatrix(headers, matrix) {
  if (!Array.isArray(headers) || typeof matrix !== 'string') {
    return [];
  }
  const key = `${matrix}.0.`;
  const matches = headers.filter((header) => header.startsWith(key));
  const properties = matches.map((header) => header.substring(key.length));
  return properties;
}

function transformGeoJsonHeaders(headers) {
  if (!Array.isArray(headers)) {
    return headers;
  }

  // Remove GeoJSON question type paths from headers
  const replaceGeoJsonPath = (str) => str.replace(/(value\.features\.\d).*/, '$1');
  return [...new Set(headers.map(replaceGeoJsonPath))];
}

export {
  transformMatrixHeaders,
  getCellValue,
  getPropertiesFromMatrix,
  transformGeoJsonHeaders,
  PREFERRED_HEADERS,
}
