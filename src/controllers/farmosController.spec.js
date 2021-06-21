import { getFarms } from './farmosController';
import { ObjectId } from 'mognodb';

function mockGetCredentials() {
  return [
    {
      _id: ObjectId('60ce2fbcc5a98c21341c2a0c'),
      name: 'ourscitest.farmos.net',
      url: 'ourscitest.farmos.net',
      aggregatorURL: 'oursci.farmos.group',
      aggregatorApiKey: 'asdfasdfasdfasdf',
      farmId: 7
    }
  ];
}

describe('farmOS controller', () => {
  describe('farms endpoint', () => {
    
  });
});