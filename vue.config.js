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
    port: process.env.VUE_APP_DEV_SERVER_PORT || 8080,
    disableHostCheck: true,
    compress: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.VUE_APP_API_DEV_SERVER_PORT || 3000}/api`,
        ws: true,
        changeOrigin: true,
      },
      '/bucket': {
        target: `http://localhost:${process.env.VUE_APP_API_DEV_SERVER_PORT || 3000}/api`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  pwa: {
    name: 'Surveystack',
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
