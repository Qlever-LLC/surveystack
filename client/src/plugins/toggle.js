import { UnleashClient } from 'unleash-proxy-client';

export const startToggle = (store) => {
  const unleash = new UnleashClient({
    // TODO remove and regenerate these keys on GitLab
    url: `${location.origin}/api/toggles/proxy`,
    clientKey: 'proxy-secret',
    appName: process.env.VUE_APP_ENVIRONMENT || 'staging',
  });

  unleash.on('initialized', (...args) => {
    console.log('INITIALIZED', args, unleash.getAllToggles());
    store.commit('toggle/updateToggles', unleash.getAllToggles());
  });
  unleash.on('update', (...args) => {
    console.log('UPDATE', args, unleash.getAllToggles());
    store.commit('toggle/updateToggles', unleash.getAllToggles());
  });

  store.registerModule('toggle', {
    namespaced: true,
    state: {
      // object map {[toggleName: string]: isEnabled: boolean}
      isOn: {},
    },
    getters: {
      isOn: (state) => state.isOn,
    },
    mutations: {
      updateToggles(state, allToggles) {
        // convert toggle array to object map
        state.isOn = allToggles.reduce((isOn, toggle) => ({ ...isOn, [toggle.name]: toggle.enabled }), {});
      },
    },
  });

  // Keep the user ID in sync with the store
  store.watch(
    (_, getters) => getters['auth/user']._id,
    (userId) => {
      // set the user ID in the context so randomly enabled features can be consistent per user
      unleash.updateContext({ userId });
    },
    { immediate: true }
  );

  unleash.start();
};

// unleash.on('ready', () => {
//   console.log('ready/unleash/sentry', unleash.isEnabled('sentry'));
//   console.log('ready/unleash/test', unleash.isEnabled('test'));
//   console.log('ready/unleash/test-user-list', unleash.isEnabled('test-user-list'));
// });

// unleash.on('initialized', () => {
//   console.log('initialized/unleash/sentry', unleash.isEnabled('sentry'));
//   console.log('initialized/unleash/test', unleash.isEnabled('test'));
//   console.log('initialized/unleash/test-user-list', unleash.isEnabled('test-user-list'));
//   console.log('all toggles', unleash.getAllToggles());
// });
