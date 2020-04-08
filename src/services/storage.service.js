const AUTH_STATUS_KEY = 'auth_status';
const AUTH_USER_KEY = 'auth_user';
const AUTH_HEADER_KEY = 'auth_header';
const AUTH_SHAPESHIFT_USER_KEY = 'auth_shapeshift_user';
const AUTH_SHAPESHIFT_HEADER_KEY = 'auth_shapeshift_header';
const USER_MEMBERSHIP_KEY = 'user_memberships';
const USER_MEMBERSHIP_STATUS_KEY = 'user_memberships_status';
const USER_ACTIVE_GROUP_KEY = 'user_active_group';

const AuthService = {
  getStatus() {
    return localStorage.getItem(AUTH_STATUS_KEY) || '';
  },
  saveStatus(status) {
    localStorage.setItem(AUTH_STATUS_KEY, status);
  },
  getUser() {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY)) || {};
  },
  saveUser(user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },
  getHeader() {
    return localStorage.getItem(AUTH_HEADER_KEY) || '';
  },
  saveHeader(header) {
    localStorage.setItem(AUTH_HEADER_KEY, header);
  },
  getShapeshiftUser() {
    return JSON.parse(localStorage.getItem(AUTH_SHAPESHIFT_USER_KEY)) || {};
  },
  saveShapeshiftUser(shapeshiftUser) {
    localStorage.setItem(
      AUTH_SHAPESHIFT_USER_KEY,
      JSON.stringify(shapeshiftUser),
    );
  },
  getShapeshiftHeader() {
    return localStorage.getItem(AUTH_SHAPESHIFT_HEADER_KEY) || '';
  },
  saveShapeshiftHeader(shapeshiftUser) {
    localStorage.setItem(AUTH_SHAPESHIFT_HEADER_KEY, shapeshiftUser);
  },
  clear() {
    localStorage.removeItem(AUTH_STATUS_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_HEADER_KEY);
    localStorage.removeItem(AUTH_SHAPESHIFT_USER_KEY);
    localStorage.removeItem(AUTH_SHAPESHIFT_HEADER_KEY);
  },
  shapeshiftPush({
    status, user, header, shapeshiftUser, shapeshiftHeader,
  }) {
    this.saveStatus(status);
    this.saveUser(user);
    this.saveHeader(header);
    this.saveShapeshiftUser(shapeshiftUser);
    this.saveShapeshiftHeader(shapeshiftHeader);
  },
  shapeshiftPop() {
    const user = this.getShapeshiftUser();
    const header = this.getShapeshiftHeader();
    this.saveUser(user);
    this.saveHeader(header);
    localStorage.removeItem(AUTH_SHAPESHIFT_USER_KEY);
    localStorage.removeItem(AUTH_SHAPESHIFT_HEADER_KEY);
    return { user, header };
  },
};

const MembershipService = {
  getStatus() {
    return localStorage.getItem(USER_MEMBERSHIP_STATUS_KEY) || '';
  },
  saveStatus(status) {
    localStorage.setItem(USER_MEMBERSHIP_STATUS_KEY, status);
  },
  getUserMemberships() {
    return JSON.parse(localStorage.getItem(USER_MEMBERSHIP_KEY)) || [];
  },
  saveMemberships(memberships = []) {
    localStorage.setItem(USER_MEMBERSHIP_KEY, JSON.stringify(memberships));
  },
  clear() {
    localStorage.removeItem(USER_MEMBERSHIP_STATUS_KEY);
    localStorage.removeItem(USER_MEMBERSHIP_KEY);
  },
};

const GroupService = {
  saveActiveGroup(group) {
    localStorage.setItem(USER_ACTIVE_GROUP_KEY, JSON.stringify(group));
  },
  getActiveGroup() {
    return JSON.parse(localStorage.getItem(USER_ACTIVE_GROUP_KEY));
  },
  clear() {
    localStorage.removeItem(USER_ACTIVE_GROUP_KEY);
  },
};

export {
  AuthService,
  MembershipService,
  GroupService,
};
