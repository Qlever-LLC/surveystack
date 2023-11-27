import { UnleashClient } from 'unleash-proxy-client';

export const startToggle = (store) => {
  const unleash = new UnleashClient({
    url: `${location.origin}/api/toggles/proxy`,
    clientKey: 'proxy',
    // The Unleash SDK requires it, but unused with GitLab
    appName: '_',
  });

  const updateStore = () => store.commit('toggle/updateToggles', unleash.getAllToggles());
  unleash.on('initialized', () => {
    updateStore();
    store.commit('toggle/loaded');
  });
  unleash.on('update', updateStore);

  store.addModule('toggle', {
    namespaced: true,
    state: {
      // true if the toggle states are loaded from the server or from localStorage
      isLoaded: false,
      // object map {[toggleName: string]: isEnabled: boolean}
      isOn: {},
    },
    getters: {
      isLoaded: (state) => state.isLoaded,
      isOn: (state) => state.isOn,
    },
    mutations: {
      updateToggles(state, allToggles) {
        // convert toggle array to object map
        state.isOn = allToggles.reduce((isOn, toggle) => ({ ...isOn, [toggle.name]: toggle.enabled }), {});
      },
      loaded(state) {
        state.isLoaded = true;
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
