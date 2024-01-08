const { getRoles } = jest.requireActual('../../services/roles.service');

const createReq = ({
  body = {},
  params = {},
  query = {},
  headers = {},
  cookies = {},
  protocol = 'https',
} = {}) => ({
  body,
  params,
  query,
  cookies,
  headers: {
    origin: 'https://surveystack.io',
    host: 'test.surveystack.io',
    ...headers,
  },
  get(key) {
    return this.headers[key];
  },
  protocol,
});

const createRes = async ({ user = null } = {}) => ({
  send: jest.fn(),
  json: jest.fn(),
  redirect: jest.fn(),
  cookie: jest.fn(),
  status: jest.fn().mockReturnThis(),
  set: jest.fn(),
  attachment: jest.fn(),
  locals: {
    auth: {
      isAuthenticated: !!user,
      isSuperAdmin: user && user.permissions.includes('super-admin'),
      user,
      roles: user ? await getRoles(user._id) : [],
    },
  },
  _headers: {},
});

export { createReq, createRes };
