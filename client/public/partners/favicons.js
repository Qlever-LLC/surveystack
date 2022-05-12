const favicons = require("favicons");
const fs = require('fs');
const path = require('path');
const configuration = {
    path: "/", // Path for overriding default icons path. `string`
    appName: null, // Your application's name. `string`
    appShortName: null, // Your application's short_name. `string`. Optional. If not set, appName will be used
    appDescription: null, // Your application's description. `string`
    developerName: null, // Your (or your developer's) name. `string`
    developerURL: null, // Your (or your developer's) URL. `string`
    dir: "auto", // Primary text direction for name, short_name, and description
    lang: "en-US", // Primary language for name and short_name
    background: "#fff", // Background colour for flattened icons. `string`
    theme_color: "#fff", // Theme color user for example in Android's task switcher. `string`
    appleStatusBarStyle: "black-translucent", // Style for Apple status bar: "black-translucent", "default", "black". `string`
    display: "standalone", // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser". `string`
    orientation: "any", // Default orientation: "any", "natural", "portrait" or "landscape". `string`
    scope: "/", // set of URLs that the browser considers within your app
    start_url: "/", // Start URL when launching the application from a device. `string`
    preferRelatedApplications: false, // Should the browser prompt the user to install the native companion app. `boolean`
    relatedApplications: undefined, // Information about the native companion apps. This will only be used if `preferRelatedApplications` is `true`. `Array<{ id: string, url: string, platform: string }>`
    // version: "1.0", // Your application's version string. `string`
    logging: true, // Print logs to console? `boolean`
    pixel_art: false, // Keeps pixels "sharp" when scaling up, for pixel art.  Only supported in offline mode.
    loadManifestWithCredentials: false, // Browsers don't send cookies when fetching a manifest, enable this to fix that. `boolean`
    manifestMaskable: false, // Maskable source image(s) for manifest.json. "true" to use default source. More information at https://web.dev/maskable-icon/. `boolean`, `string`, `buffer` or array of `string`
    icons: {
      // Platform Options:
      // - offset - offset in percentage
      // - background:
      //   * false - use default
      //   * true - force use default, e.g. set background for Android icons
      //   * color - set background for the specified icons
      //
      android: true, // Create Android homescreen icon. `boolean` or `{ offset, background }` or an array of sources
      appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset, background }` or an array of sources
      appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background }` or an array of sources
      favicons: true, // Create regular favicons. `boolean` or `{ offset, background }` or an array of sources
      windows: true, // Create Windows 8 tile icons. `boolean` or `{ offset, background }` or an array of sources
      yandex: false, // Create Yandex browser icon. `boolean` or `{ offset, background }` or an array of sources
    },
    shortcuts: [
      // Your applications's Shortcuts (see: https://developer.mozilla.org/docs/Web/Manifest/shortcuts)
      // Array of shortcut objects:
    //   {
    //     name: "View your Inbox", // The name of the shortcut. `string`
    //     short_name: "inbox", // optionally, falls back to name. `string`
    //     description: "View your inbox messages", // optionally, not used in any implemention yet. `string`
    //     url: "/inbox", // The URL this shortcut should lead to. `string`
    //     icon: "test/inbox_shortcut.png", // source image(s) for that shortcut. `string`, `buffer` or array of `string`
    //   },
    ],
    // more shortcuts objects
  };


function writeFile(pathPrefix, name, contents, config = { verbose: true, dryRun: false } ) {
  const fileName = path.join(pathPrefix, name)
  if (config.verbose) {
    console.log(fileName);
  }
  if (!config.dryRun) {
    fs.writeFileSync(fileName, contents);
  }
}

function replaceAndroidChromeString(str) {
  return str.replace('android-chrome-', 'icon-')
}

const callback = function (error, response) {
    if (error) {
      console.log(error.message); // Error description e.g. "An unknown error has occurred"
      return;
    }
    console.log('\nWriting image files:');
    response.images.forEach(({ name, contents }) => writeFile(outputPath, replaceAndroidChromeString(name), contents, { verbose: true, dryRun: false }));
    response.files.forEach(({ name, contents }) => {
      if (name === 'manifest.webmanifest') {
        console.log('\nmanifest.json icons array:')
        console.log(JSON.parse(contents).icons.map(icon => ({ ...icon, src: `./images/icons${replaceAndroidChromeString(icon.src)}`})));
      }
    });
  };

const [_, __, iconPath, outputPath] = process.argv;
if (process.argv.length !== 4) {
  console.info('Generate brand assets\nUsage: node favicons.js <path-to-icon.svg> <output-path>');
} else if (!(/\.(svg|png)$/i).test(iconPath)) {
  console.error('Invalid icon path, icon must be of type SVG or PNG');
} else if (!fs.existsSync(iconPath)) {
  console.error('Icon file does not exist');
} else {
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }
  favicons.favicons(iconPath, configuration, callback);
}
