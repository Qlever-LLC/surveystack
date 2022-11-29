import mung from 'express-mung';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../services/logging.service';

function initializeLoggingMessage(req) {
  return {
    method: req.method,
    path: req.path,
    requestBody: JSON.stringify(req.body),
    query: req.query,
    ip: req.ip,
    originalUrl: req.originalUrl,
    userAgent: req.get('User-Agent'),
    authorizationHeader: req.get('Authorization')?.split(' ')[0],
    correlationId: req.get('X-Correlation-Id') ?? uuidv4(),
    timestamp: new Date(),
    responseBody: null,
    httpStatus: null,
    duration: null,
  };
}

function initLogging(req, res, next) {
  if (process.env.ELASTIC_ENABLE_LOGGING === 'true') {
    res.locals.loggingMessage = initializeLoggingMessage(req);
    res.on('finish', function () {
      res.locals.loggingMessage.httpStatus = res.statusCode;
      res.locals.loggingMessage.duration =
        Date.now() - res.locals.loggingMessage.timestamp.valueOf();
      log(res.locals.loggingMessage);
    });
  }
  next();
}

function appendDatabaseOperationDurationToLoggingMessage(res, duration) {
  if (process.env.ELASTIC_ENABLE_LOGGING === 'true') {
    res.locals.loggingMessage.databaseOperationDuration = duration;
  }
}

// Logging response bodies can use significant amounts of storage.
// Consider log volume, index lifecycle policy (duration to keep logs), and available storage before using this middleware.
const appendResponseBodyToLoggingMessage = mung.json(
  (resBody, req, res) => {
    if (process.env.ELASTIC_ENABLE_LOGGING === 'true') {
      res.locals.loggingMessage.resBody = JSON.stringify(resBody);
    }
  },
  { mungError: true }
);

export {
  initLogging,
  appendResponseBodyToLoggingMessage,
  appendDatabaseOperationDurationToLoggingMessage,
};
