const users = [
  {
    _id: "5dad91cd925e13de6f174644",
    username: "rudi",
    email: "andreas.rudolf@nexus-computing.ch",
    permissions: ["/u/rudi"],
    token: "d17ed6f3-56dc-4a78-b9a2-7c92bc2dc87e",
    password: "$2y$12$mYt5xTT1xGNRR4VIjiIqg.HXjQKGz1fKhh/li6f3J70FNPyM0aP3W",
    authProviders: [
      {
        name: "google",
        username: "iDFQjGUDJjMBQhWAIejvv4tcf4m1",
        email: "andreas.rudolf@nexus-computing.ch"
      }
    ]
  },
  {
    _id: "5daed53c05d1f7827718c82c",
    username: "josie12",
    email: "josephine12@yahoo.com",
    permissions: ["/u/josie12"],
    token: "a2c24830-7b8a-4275-a3de-4954b6542ad8",
    password: "$2y$12$k7kQD4AshDfky4HFcQfy/OwkzxK8n3SRXYZHep5CGbFypCiCrkHli",
    authProviders: [
      {
        name: "google",
        username: "boqiubc019dqoiqdBDOBKlkl",
        email: "josephine12@yahoo.com"
      }
    ]
  }
];

const groups = [
  {
    _id: "gregs-friends",
    name: "Greg's friends",
    admins: [],
    members: [],
    open: true
  },
  {
    _id: "rfc/community",
    name: "RFC community",
    admins: [],
    members: [],
    open: true
  },
  {
    _id: "rfc/lab",
    name: "RFC Lab",
    admins: [],
    members: [],
    open: false
  }
];

const organizations = [
  {
    _id: "rfc",
    name: "Real Food Campaign",
    admins: [],
    members: [],
    groups: ["rfc/community", "rfc/lab"],
    open: true
  }
];

const groups2 = [
  {
    handle: "our-sci",
    name: "Our-Sci",
    admins: [],
    members: [],
    open: true,
    subgroups: [
      {
        handle: ""
      }
    ]
  }
];
