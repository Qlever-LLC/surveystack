/* eslint-disable no-param-reassign */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const LCL = require('last-commit-log');

const fs = require('fs');

const lcl = new LCL('../');
const commit = lcl.getLastCommitSync();
process.env.VUE_APP_GIT_HASH = commit.hash;
process.env.VUE_APP_GIT_TAG = commit.gitTag;
process.env.VUE_APP_GIT_DATE = commit.committer.date;
process.env.VUE_APP_LCL = JSON.stringify(commit);

const packageJson = fs.readFileSync('./package.json');
const version = JSON.parse(packageJson).version || 0;
process.env.VUE_APP_VERSION = version;

module.exports = {
  chainWebpack: (config) => {
    config.plugins.delete('pwa');
  },
  configureWebpack: {
    resolve: {
      alias: {
        'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api.js',
      },
    },
    plugins: [
      new MonacoWebpackPlugin({
        languages: ['javascript', 'typescript'],
        features: [],
      }),
      new CompressionPlugin(),
      new CopyPlugin({
        patterns: ['src/utils/sandboxUtils.js'],
      }),
    ],
  },
  transpileDependencies: ['vuetify'],
  devServer: {
    port: process.env.VUE_APP_DEV_SERVER_PORT || 8080,
    disableHostCheck: true,
    compress: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    // proxy: {
    //   '^/api': {
    //     target: 'http://localhost:3000/api',
    //     ws: true,
    //     // changeOrigin: true,
    //   },
    //   '^/bucket': {
    //     target: 'http://localhost:3000/bucket',
    //     ws: true,
    //     // changeOrigin: true,
    //   },
    // },
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.VUE_APP_DEV_API_SERVER_PORT || 3000}`,
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
      navigateFallback: 'index.html',
      navigateFallbackBlacklist: [/\/static\/.*$/, /\/api\/auth\/.*$/], //rename this to navigateFallbackDenylist when migrating to vue3
      runtimeCaching: [
        {
          urlPattern: /\/api\/.*$/,
          handler: 'NetworkFirst',
        },
        // {
        //   urlPattern: /https:\/\/api\.mapbox\.com.*$/,
        //   handler: 'CacheFirst',
        // },
      ],
    },
  },
  pluginOptions: {},
};
