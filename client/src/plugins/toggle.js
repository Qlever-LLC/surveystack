import { UnleashClient } from 'unleash-proxy-client';

export const startToggle = (store) => {
  const unleash = new UnleashClient({
    url: `${location.origin}/api/toggles/proxy`,
    clientKey: 'proxy-secret',
    appName: process.env.VUE_APP_ENVIRONMENT || 'staging',
  });

  const updateStore = () => store.commit('toggle/updateToggles', unleash.getAllToggles());
  unleash.on('initialized', updateStore);
  unleash.on('update', updateStore);

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
    (_, getters) => String(getters['auth/user'].email).toLowerCase(),
    (userId) => {
      // set the user ID in the context so randomly enabled features can be consistent per user
      unleash.updateContext({ userId });
    },
    { immediate: true }
  );

  unleash.start();
};