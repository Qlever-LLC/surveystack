import dotenv from 'dotenv-defaults/config';

import { connectDatabase } from './db';
import { initAdmins } from './services/admin.service';

import createApp from './app';

const app = createApp();

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
