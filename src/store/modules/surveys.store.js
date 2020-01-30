import api from '@/services/api.service';


export const types = {
  FETCH_SURVEY: 'FETCH_SURVEY',
  FETCH_SURVEYS: 'FETCH_SURVEYS',
  // GET_SURVEY: 'GET_SURVEY',
  SET_SURVEY: 'SET_SURVEY',
  RESET: 'RESET',
  REMOVE_SURVEY: 'REMOVE_SURVEY',
  ADD_SURVEY: 'ADD_SURVEY',
  SET_SURVEYS: 'SET_SURVEYS',
  CREATE_SURVEY: 'CREATE_SURVEY',
};

const createInitialState = () => ({
  surveys: [],
});

const initialState = createInitialState();

const getters = {
  getSurvey: state => id => state.surveys.find(survey => survey._id === id),
};

const mutations = {
  [types.RESET](state) {
    const newState = createInitialState();
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
  },
  [types.ADD_SURVEY](state, survey) {
    state.surveys.push(survey);
  },
  [types.SET_SURVEYS](state, surveys) {
    state.surveys = surveys;
  },
  [types.REMOVE_SURVEY](state, id) {
    const index = state.surveys.findIndex(survey => survey._id === id);
    state.submissions.splice(index, 1);
  },
};

const actions = {
  reset({ commit }) {
    commit(types.RESET);
  },
  async fetchSurveys({ commit }) {
    console.log('fetching surveys');
    const response = await api.get('/surveys');
    commit(types.SET_SURVEYS, response.data);
    return response.data;
  },
  async fetchSurvey({ commit }, id) {
    const response = await api.get(`/surveys/${id}`);
    commit(types.ADD_SURVEY, response.data);
    return response.data;
  },
  removeSurvey({ commit }, id) {
    commit(types.REMOVE_SURVEY, id);
  },

};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
  types,
};
