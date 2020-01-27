const users = [
  {
    _id: '5dad91cd925e13de6f174644', // user id
    email: 'andreas.rudolf@nexus-computing.ch', // unique email
    name: 'rudi', // username, optional?
    permissions: ['5dad91cd925e13de6f174644'],
    token: 'd17ed6f3-56dc-4a78-b9a2-7c92bc2dc87e', // token used in header "Authorization: $email $token"
    password: '$2y$12$mYt5xTT1xGNRR4VIjiIqg.HXjQKGz1fKhh/li6f3J70FNPyM0aP3W',
    authProviders: [
      // linked social login accounts
      {
        name: 'google',
        username: 'iDFQjGUDJjMBQhWAIejvv4tcf4m1',
        email: 'andreas.rudolf@nexus-computing.ch',
      },
    ],
  },
  {
    _id: '5daed53c05d1f7827718c82c',
    email: 'josephine12@yahoo.com',
    name: 'josie12',
    permissions: ['5daed53c05d1f7827718c82c'],
    token: 'a2c24830-7b8a-4275-a3de-4954b6542ad8',
    password: '$2y$12$k7kQD4AshDfky4HFcQfy/OwkzxK8n3SRXYZHep5CGbFypCiCrkHli',
    authProviders: [
      {
        name: 'google',
        username: 'boqiubc019dqoiqdBDOBKlkl',
        email: 'josephine12@yahoo.com',
      },
    ],
  },
];
