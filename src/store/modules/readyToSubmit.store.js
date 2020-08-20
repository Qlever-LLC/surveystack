// import * as db from '@/store/db';

// export const types = {
//   mutations: {
//     RESET: 'RESET',
//     SET: 'SET',
//     ADD: 'ADD',
//     REMOVE: 'REMOVE',
//   },
//   actions: {
//     reset: 'reset',
//     add: 'add',
//     remove: 'remove',
//     get: 'get',
//     getAll: 'getAll',
//   },
// };


// const createInitialState = () => ({
//   readyToSubmit: [],
// });

// const initialState = createInitialState();

// const getters = {
// };

// const mutations = {
//   [types.mutations.RESET](state) {
//     Object.assign(state, createInitialState());
//   },
//   [types.mutations.SET](state, arr) {
//     state.readyToSubmit = arr;
//   },
//   [types.mutations.ADD](state, id) {
//     state.readyToSubmit.push(id);
//   },
//   [types.mutations.REMOVE](state, id) {
//     const index = state.readyToSubmit.findIndex(({ _id }) => _id === id);
//     state.readyToSubmit.splice(index, 1);
//   },
// };

// const actions = {
//   async [types.actions.reset]({
//     commit,
//   }) {
//     await db.clearAllReadyToSubmit();
//     commit(types.mutations.RESET);
//   },
//   async [types.actions.getAll]({
//     commit,
//   }) {
//     const response = await new Promise((resolve) => {
//       db.openDb(() => {
//         db.getAllReadyToSubmit(results => resolve(results));
//       });
//     });
//     // console.log('get all ready to submit', response);
//     commit(types.mutations.SET, response.map(({ _id }) => _id));
//     return response;
//   },
//   async [types.actions.get]({
//     state,
//     dispatch,
//   }, id) {
//     const readyToSubmit = state.readyToSubmit.length > 0
//       ? state.readyToSubmit
//       : await dispatch(types.actions.fetchLocalSubmissions);
//     return readyToSubmit.find(({ _id }) => _id === id);
//   },
//   async [types.actions.add]({
//     commit,
//   }, id) {
//     // TODO: submissions should be a unique collection, we shouldn't just push
//     const result = await db.saveToIndexedDB(db.stores.READY_TO_SUBMIT, { _id: id });
//     commit(types.mutations.ADD, id);
//   },
//   async [types.actions.remove]({
//     commit,
//   }, id) {
//     await db.removeFromIndexedDB(db.stores.READY_TO_SUBMIT, id);
//     commit(types.mutations.REMOVE, id);
//   },
// };

// export default {
//   namespaced: true,
//   state: initialState,
//   getters,
//   actions,
//   mutations,
//   types,
// };
