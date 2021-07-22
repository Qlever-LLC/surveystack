/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */

const partners = [];

function importAll(r) {
  r.keys().forEach((key) => {
    const partner = r(key).default;
    partners.push(partner);
  });
}

importAll(require.context('@/partners/', false, /\.js$/));

export default {
  install(vue) {
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

    // console.log('parts', parts);
    if (parts.length > 0) {
      const subdomain = parts[0];
      const activePartner = partners.find((p) => p.domain === subdomain);

      if (activePartner) {
        // every property needs to be set manually to force a reactive update
        vue.$vuetify.theme.themes.light.primary = activePartner.themes.light.primary;
        vue.$vuetify.theme.themes.light.secondary = activePartner.themes.light.secondary;
        vue.$vuetify.theme.themes.light.accent = activePartner.themes.light.accent;
        vue.$vuetify.theme.themes.light.error = activePartner.themes.light.error;
        vue.$vuetify.theme.themes.light.warning = activePartner.themes.light.warning;
        vue.$vuetify.theme.themes.light.info = activePartner.themes.light.info;
        vue.$vuetify.theme.themes.light.success = activePartner.themes.light.success;
        vue.$vuetify.theme.themes.light.appbar = activePartner.themes.light.appbar;
        vue.$vuetify.theme.themes.light.background = activePartner.themes.light.background || '#ffffff';

        manifestElement.setAttribute('href', `/partners/${subdomain}/manifest.json`);
        iconElement.setAttribute('href', `/partners/${subdomain}/images/icons/icon-72x72.png`);
        appleTouch.setAttribute('href', `/partners/${subdomain}/images/icons/icon-512x512.png`);
        appBarThemeColor.setAttribute('content', activePartner.themes.light.appbar);

        document.title = activePartner.name;

        // set whitelabel
        vue.$store.dispatch('whitelabel/setPartner', activePartner);
      }
    }

    document.head.appendChild(manifestElement);
    document.head.appendChild(iconElement);
    document.head.appendChild(appleTouch);
    document.head.appendChild(appBarThemeColor);
  },
};
