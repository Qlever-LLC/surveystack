import dotenv from 'dotenv-defaults';
dotenv.config();

import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import history from 'connect-history-api-fallback';

import { connectDatabase, db } from './db';
import { initAdmins } from './services/admin.service';
import { getRoles } from './services/roles.service';
import errorHandlers from './handlers/errorHandlers';

import apiRoutes from './routes/api';
import debugRoutes from './routes/debug';

import resources from './controllers/resources';

const subdomainRedirect = {
  rfc: 'bionutrient',
};

const PATH_PREFIX = process.env.PATH_PREFIX;

const app = express();
const frontend = expressStaticGzip('../client/dist');

/**
 * Hard-Redirect certain subdomains after migration.
 * To test this locally, build the client and serve it using the server.
 * Modify /etc/hosts to achieve subdomain behavihour.
 */
app.use(async (req, res, next) => {
  const { host } = req.headers;
  const protocol = req.protocol;
  
  const subdomain = req.subdomains.join('.');
  const key = Object.keys(subdomainRedirect).find(k => k === subdomain);
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

const whitelist = ['https://cdpn.io', 'https://app.our-sci.net', 'https://dashboard.our-sci.net'];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // specifically allow whitelisted origins including credentials
    } else if (origin.startsWith('http://localhost') || origin.startsWith('http://192.168')) {
      callback(null, true);
    } else {
      //callback(new Error('Not allowed by CORS'));
      callback(null, true);
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

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
      const cookieOptions = {
        expires: new Date(Date.now() + 1000 * 3600 * 24 * 14),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
      }; // expire after 14 days
      res.cookie('user', user._id.toString(), cookieOptions);
      res.cookie('token', user.token, cookieOptions);
    }

    if (user) {
      roles = await getRoles(user._id);
    }
  }

  res.locals.auth = {
    isAuthenticated,
    isSuperAdmin,
    user,
    roles,
  };

  next();
});

// routes
app.use(`${PATH_PREFIX}/api`, apiRoutes);
app.use(`${PATH_PREFIX}/api`, errorHandlers.developmentErrors);

app.use('/resources/:id', resources.serve);

if (process.env.NODE_ENV === 'development') {
  app.use('/debug', debugRoutes);
}

// Serve Vue.js from dist folder
// https://github.com/bripkens/connect-history-api-fallback/tree/master/examples/static-files-and-index-rewrite
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

const connectAndListen = async () => {
  try {
    await connectDatabase();
    await initAdmins();

    app.listen(process.env.PORT, () => {
      console.log(`Express app listening on ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};

connectAndListen();
