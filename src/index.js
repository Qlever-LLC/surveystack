import dotenv from 'dotenv-defaults';
dotenv.config();

import express from 'express';
import cors from 'cors';
import history from 'connect-history-api-fallback';

import { connectDatabase, db } from './db';
import { initAdmins } from './services/admin.service';
import errorHandlers from './handlers/errorHandlers';

import apiRoutes from './routes/api';
import debugRoutes from './routes/debug';

const PATH_PREFIX = process.env.PATH_PREFIX;

const app = express();
const frontend = express.static('../our-sci-pwa/dist');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// auth
app.use(async (req, res, next) => {
  let isAuthenticated = false;
  let isAdmin = false;
  let user = null;
  if (req.headers.authorization) {
    //console.log("authHeader", req.headers.authorization);
    const authHeader = req.headers.authorization;
    const [email, token] = authHeader.split(' ');

    user = await db.collection('users').findOne({ email, token });
    if (user) {
      isAuthenticated = true;
      isAdmin = user.permissions.includes('admin');
    }
  }

  res.locals.auth = {
    isAuthenticated,
    isAdmin,
    user,
  };

  next();
});

// routes
app.use(`${PATH_PREFIX}/api`, apiRoutes);
app.use(`${PATH_PREFIX}/api`, errorHandlers.developmentErrors);

app.use('/debug', debugRoutes);

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
