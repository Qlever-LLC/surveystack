const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  configureWebpack: {
    plugins: [
      new MonacoWebpackPlugin({
        languages: ['javascript', 'typescript'],
      }),
    ],
  },
  transpileDependencies: [
    'vuetify',
  ],
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  pwa: {
    name: 'Our-Sci',
    themeColor: '#f44336',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',

    // configure the workbox plugin
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      // swSrc is required in InjectManifest mode.
      swDest: 'service-worker.js',
      // ...other Workbox options...
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [{
        urlPattern: /\/api\/surveys.*$/,
        handler: 'NetworkFirst',
      },
      {
        urlPattern: /https:\/\/api\.mapbox\.com.*$/,
        handler: 'CacheFirst',
      },
      ],
    },
  },
};
