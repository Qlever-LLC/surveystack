import api from '@/services/api.service';
import { AuthService, MembershipService, GroupService } from '@/services/storage.service';

const createInitialState = () => ({
  status: AuthService.getStatus(),
  user: AuthService.getUser(),
  header: AuthService.getHeader(),
  shapeshiftUser: AuthService.getShapeshiftUser(),
  shapeshiftHeader: AuthService.getShapeshiftHeader(),
});

const initialState = createInitialState();

const getters = {
  authStatus: state => state.status,
  isLoggedIn: state => state.status === 'success',
  isAdmin: state => state.user && state.user.permissions.includes('admin'),
  isSuperAdmin: state => state.user && state.user.permissions.includes('super-admin'),
  user: state => state.user,
  isShapeshifting: state => state.shapeshiftHeader && state.shapeshiftUser,
};

const clearLocalData = ({ dispatch }) => {
  // remove default Authentication headers
  api.removeHeaders();
  // remove items from storage
  AuthService.clear();
  MembershipService.clear();
  GroupService.clear();

  console.log('calling global reset...');
  dispatch('reset', null, { root: true });
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  login({ commit, dispatch }, auth) {
    return new Promise((resolve, reject) => {
      commit('auth_request');
      api
        .post(auth.url, auth.user)
        .then((resp) => {
          const user = resp.data;
          const { email, token } = user;
          const header = `${email} ${token}`;

          AuthService.saveStatus('success');
          AuthService.saveUser(user);
          AuthService.saveHeader(header);
          api.setHeader('Authorization', header);

          commit('auth_success', { user, header });
          resolve(resp.data);
        })
        .catch((err) => {
          console.log(err);
          commit('auth_error');
          // clearLocalData({ dispatch });
          reject(err);
        });
    });
  },
  logout({ commit, dispatch }) {
    return new Promise((resolve) => {
      commit('logout');
      clearLocalData({ dispatch });
      resolve();
    });
  },
  enterShapeshift({ commit, dispatch, state }, id) {
    return new Promise((resolve, reject) => {
      commit('auth_request');
      api
        .get(`/admin/user/${id}`)
        .then((resp) => {
          const user = resp.data;
          const { email, token } = user;
          const header = `${email} ${token}`;

          AuthService.shapeshiftPush({
            status: 'success',
            user,
            header,
            shapeshiftUser: state.user,
            shapeshiftHeader: state.header,
          });
          api.setHeader('Authorization', header);
          commit('shapeshift_push', {
            user: state.user,
            header: state.header,
          });
          commit('auth_success', { user, header });
          resolve(resp);
        })
        .catch((err) => {
          commit('auth_error');
          // clearLocalData({ dispatch });
          reject(err);
        });
    });
  },
  leaveShapeshift({ commit }) {
    const { user, header } = AuthService.shapeshiftPop();
    api.setHeader('Authorization', header);
    commit('shapeshift_pop');
    commit('auth_success', { user, header });
  },
};

const mutations = {
  RESET(state) {
    Object.assign(state, createInitialState());
  },
  auth_request(state) {
    state.status = 'loading';
  },
  auth_success(state, { user, header }) {
    state.status = 'success';
    state.user = user;
    state.header = header;
  },
  auth_error(state) {
    state.status = 'error';
    state.user = {};
    state.header = '';
  },
  logout(state) {
    state.status = '';
    state.user = {};
    state.header = '';
    state.shapeshiftUser = {};
    state.shapeshiftHeader = '';
  },
  shapeshift_push(state, { user, header }) {
    state.shapeshiftUser = user;
    state.shapeshiftHeader = header;
  },
  shapeshift_pop(state) {
    state.shapeshiftUser = {};
    state.shapeshiftHeader = '';
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
