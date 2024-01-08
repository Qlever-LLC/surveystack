/* eslint-disable no-param-reassign */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const LCL = require('last-commit-log');
const { VuetifyPlugin } = require('webpack-plugin-vuetify');

const fs = require('fs');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

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
      fallback: {
        path: require.resolve('path-browserify'),
        //buffer: require.resolve('buffer-browserify'),
      },
    },
    plugins: [
      new NodePolyfillPlugin(),
      new MonacoWebpackPlugin({
        languages: ['javascript', 'typescript'],
        features: [],
      }),
      new CompressionPlugin(),
      new CopyPlugin({
        patterns: ['src/utils/sandboxUtils.js'],
      }),
      new VuetifyPlugin({ autoImport: true }), // Enabled by default
    ],
  },
  transpileDependencies: ['vuetify'],
  devServer: {
    port: process.env.VUE_APP_DEV_SERVER_PORT || 8080,
    allowedHosts: 'all',
    compress: true,
    client: {
      overlay: false,
    },
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
      clientsClaim: true,
      skipWaiting: true,
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/\/static\/.*$/, /\/api\/.*$/], //rename this to navigateFallbackDenylist when migrating to vue3
      runtimeCaching: [
        {
          urlPattern: /\/api\/.*$/,
          handler: 'NetworkFirst',
        },
        // TODO: use VUE_APP_S3_BASE_URL for S3 rules, currently we don't have custom env variables per environment in client pipeline
        // Conditionally add caching rule if S3_BASE_URL env var is defined
        ...(process.env.VUE_APP_S3_BASE_URL
          ? [
              {
                urlPattern: new RegExp(`${process.env.VUE_APP_S3_BASE_URL}resources/.*`),
                handler: 'NetworkFirst',
              },
            ]
          : []),
        // caching rule for production S3 resources
        {
          urlPattern: new RegExp(`https://surveystack.s3.amazonaws.com/resources/.*`),
          handler: 'NetworkFirst',
        },
        // caching rule for review and staging environments for s3 resources
        {
          urlPattern: new RegExp(`https://surveystack-test.s3.amazonaws.com/resources/.*`),
          handler: 'NetworkFirst',
        },
      ],
    },
  },
  pluginOptions: {},
};
