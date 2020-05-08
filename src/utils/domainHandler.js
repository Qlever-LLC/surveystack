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
    const iconElement = document.createElement('link');
    iconElement.setAttribute('rel', 'icon');
    iconElement.setAttribute('href', '/favicon.ico');


    const manifestElement = document.createElement('link');
    manifestElement.setAttribute('rel', 'manifest');
    const parts = window.location.host.split('.');
    manifestElement.setAttribute('href', '/manifest.json');


    console.log('parts', parts);
    if (parts.length > 0) {
      const subdomain = parts[0];
      const activePartner = partners.find(p => p.domain === subdomain);

      if (activePartner) {
        vue.$vuetify.theme.themes.light.primary = activePartner.primaryColor;
        manifestElement.setAttribute('href', `/partners/${subdomain}/manifest.json`);
        iconElement.setAttribute('href', `/partners/${subdomain}/images/icons/icon-72x72.png`);
        document.title = activePartner.name;
        // TODO use vuex store here
        vue.$store.dispatch('appui/setPartner', activePartner);
        vue.$store.dispatch('appui/setTitle', activePartner.name);
      }
    }


    document.head.appendChild(manifestElement);
    document.head.appendChild(iconElement);
  },
};
