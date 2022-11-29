export const GROUP_PATH_DELIMITER = '/';

export const createCookieOptions = () => ({
  expires: new Date(Date.now() + 1000 * 3600 * 24 * 14),
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'None',
}); // expire after 14 days
