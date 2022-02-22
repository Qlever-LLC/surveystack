import _ from 'lodash';
import * as farmOS from '../../lib/farmos/src/index';

const ping = async () => {
  _.forEach(['one', 'two'], () => {
    console.log('hello');
  });

  let token;
  const options = {
    remote: {
      host: process.env.FARMOS2_TEST_URL,
      clientId: 'farm_client',
      getToken: () => token,
      setToken: (t) => {
        token = t;
      },
    },
  };
  const farm = farmOS(options);

  const username = process.env.FARMOS2_TEST_USER;
  const password = process.env.FARMOS2_TEST_PASSWORD;
  const r = await farm.remote.authorize(username, password);
  console.log(r);

  return 'ok';
};

export { ping };
