/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
import { vuetify } from './../plugins/vuetify';

const partners = [];

function importAll(r) {
  r.keys().forEach((key) => {
    const partner = r(key).default;
    partners.push(partner);
  });
}

importAll(require.context('@/partners/', false, /\.js$/));

export default {
  install(store) {
    const appBarThemeColor = document.createElement('meta');
    appBarThemeColor.setAttribute('name', 'theme-color');
    appBarThemeColor.setAttribute('content', '#444444');

    const iconElement = document.createElement('link');
    iconElement.setAttribute('rel', 'icon');
    iconElement.setAttribute('href', '/favicon.ico');

    const appleTouch = document.createElement('link');
    appleTouch.setAttribute('rel', 'apple-touch-icon');
    appleTouch.setAttribute('href', '/img/icons/apple-touch-icon.png');

    const manifestElement = document.createElement('link');
    manifestElement.setAttribute('rel', 'manifest');
    const parts = window.location.host.split('.');
    manifestElement.setAttribute('href', '/manifest.json');
    const partnerSubdomainOverride = localStorage.getItem('partner_subdomain_override');

    if (partnerSubdomainOverride || parts.length > 0) {
      const subdomain = partnerSubdomainOverride || parts[0];
      const activePartner = partners.find((p) => p.domain === subdomain);

      if (activePartner) {
        // every property needs to be set manually to force a reactive update
        vuetify.theme.themes.value.light.colors.primary = activePartner.themes.light.primary;
        vuetify.theme.themes.value.light.colors.secondary = activePartner.themes.light.secondary;
        vuetify.theme.themes.value.light.colors.accent = activePartner.themes.light.accent;
        vuetify.theme.themes.value.light.colors.error = activePartner.themes.light.error;
        vuetify.theme.themes.value.light.colors.warning = activePartner.themes.light.warning;
        vuetify.theme.themes.value.light.colors.info = activePartner.themes.light.info;
        vuetify.theme.themes.value.light.colors.success = activePartner.themes.light.success;
        vuetify.theme.themes.value.light.colors.appbar = activePartner.themes.light.appbar;
        vuetify.theme.themes.value.light.colors.background =
          activePartner.themes.light.background || vuetify.theme.themes.value.light.colors.background;
        vuetify.theme.themes.value.light.colors.focus =
          activePartner.themes.light.focus || activePartner.themes.light.primary;
        vuetify.theme.themes.value.light.colors.heading =
          activePartner.themes.light.heading || vuetify.theme.themes.value.light.colors.heading;

        manifestElement.setAttribute('href', `/partners/${subdomain}/manifest.json`);
        iconElement.setAttribute('href', `/partners/${subdomain}/images/icons/icon-72x72.png`);
        appleTouch.setAttribute('href', `/partners/${subdomain}/images/icons/icon-512x512.png`);
        appBarThemeColor.setAttribute('content', activePartner.themes.light.appbar);

        document.title = activePartner.name;

        // set whitelabel
        store.dispatch('whitelabel/setPartner', activePartner);
      }
    }

    document.head.appendChild(manifestElement);
    document.head.appendChild(iconElement);
    document.head.appendChild(appleTouch);
    document.head.appendChild(appBarThemeColor);

    store.dispatch('memberships/tryAutoJoinAndSelectGroup');
  },
};
