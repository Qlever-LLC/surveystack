import api from '@/services/api.service';
import { AuthService } from '@/services/storage.service';

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
  user: state => state.user,
  isShapeshifting: state => state.shapeshiftHeader && state.shapeshiftUser,
};

const actions = {
  reset({ commit }) {
    commit('RESET');
  },
  login({ commit }, auth) {
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
          resolve(resp);
        })
        .catch((err) => {
          console.log(err);
          commit('auth_error');
          AuthService.clear();
          api.removeHeaders();
          reject(err);
        });
    });
  },
  logout({ commit }) {
    return new Promise((resolve) => {
      commit('logout');
      AuthService.clear();
      api.removeHeaders();
      resolve();
    });
  },
  enterShapeshift({ commit, state }, id) {
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
          AuthService.clear();
          api.removeHeaders();
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
    const newState = initialState();
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
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
