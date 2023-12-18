import 'dotenv-defaults/config';

import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import history from 'connect-history-api-fallback';

import { db } from './db';
import { getRoles } from './services/roles.service';
import errorHandlers from './handlers/errorHandlers';
import { initLogging } from './middleware/logging';

import apiRoutes from './routes/api';
import debugRoutes from './routes/debug';

import { createCookieOptions } from './constants';
import { toggleMiddleware } from './services/featureToggle.service';
import { ObjectId } from 'mongodb';

const subdomainRedirect = {
  rfc: 'bionutrient',
};
const PATH_PREFIX = process.env.PATH_PREFIX;

function createApp() {
  const app = express();

  app.use(initLogging);

  /**
   * Hard-Redirect certain subdomains after migration.
   * To test this locally, build the client and serve it using the server.
   * Modify /etc/hosts to achieve subdomain behavihour.
   */
  app.use(async (req, res, next) => {
    const { host } = req.headers;
    const protocol = req.protocol;

    const subdomain = req.subdomains.join('.');
    const key = Object.keys(subdomainRedirect).find((k) => k === subdomain);
    if (key) {
      const redirect = `${protocol}://${subdomainRedirect[key]}${host.substring(subdomain.length)}`;
      res.writeHead(301, { Location: redirect });
      return res.end();
    }

    next();
  });

  app.use(cookieParser());
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(cors({ credentials: true }));

  // auth
  app.use(async (req, res, next) => {
    let isAuthenticated = false;
    let isSuperAdmin = false;
    let user = null;
    let roles = [];
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      const [email, token] = authHeader.split(' ');

      user = await db.collection('users').findOne({ email, token });
      if (user) {
        isAuthenticated = true;
        isSuperAdmin = user.permissions.includes('super-admin');
        res.cookie('user', user._id.toString(), createCookieOptions());
        res.cookie('token', user.token, createCookieOptions());
      }

      if (user) {
        roles = await getRoles(user._id);
      }
    }

    //read out an optional userid to delegate the request to
    let delegateToUserId = req.headers['x-delegate-to'];
    if (isAuthenticated && delegateToUserId) {
      delegateToUserId = new ObjectId(delegateToUserId);
    }

    res.locals.auth = {
      isAuthenticated,
      isSuperAdmin,
      user,
      roles,
      delegateToUserId,
    };

    next();
  });

  // feature toggles (res.locals.auth.isToggleOn(toggleName))
  app.use(toggleMiddleware);

  // routes
  app.use(`${PATH_PREFIX}/api`, apiRoutes);
  app.use(`${PATH_PREFIX}/api`, errorHandlers.developmentErrors);

  if (process.env.NODE_ENV === 'development') {
    app.use('/debug', debugRoutes);
  }

  // Serve Vue.js from dist folder
  // https://github.com/bripkens/connect-history-api-fallback/tree/master/examples/static-files-and-index-rewrite
  const frontend = expressStaticGzip('../client/dist', { index: false });
  app.use(frontend); // will catch majority of static file requests
  app.use(history()); // will rewrite requests to index.html when necessary
  app.use(frontend); // will catch rewritten requests

  // fallback not found
  app.use((req, res) => {
    return res.status(404).send({
      message: 'What you are looking for does not exist.',
      path: req.path,
      status: 404,
    });
  });

  return app;
}

export default createApp;
