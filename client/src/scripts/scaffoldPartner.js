const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const log = console.log;

function printFolderContents(dir) {
  //passsing directoryPath and callback function
  fs.readdir(dir, function(err, files) {
    //handling error
    if (err) {
      return log(chalk.bold.red(`Unable to scan directory:  ${err}`));
    }
    //listing all files using forEach
    files.forEach(function(file) {
      // print file
      if (fs.lstatSync(path.resolve(dir, file)).isDirectory()) {
        log(chalk.bold.keyword('orange')(` 📁 ${file}`));
      } else {
        log(chalk.bold.green(` 🗄  ${file}`));
      }
    });
  });
}
/**
 *
 * Generate Partner folders in /client/public/partners directory
 * @param {partnersName: string, folders: Array, manifestContent: string}
 *
 */
function generatePartnerFolders(partnerName, folders, manifestContent) {
  const basePath = `${process.cwd()}/public/partners/`;
  folders.forEach((folder) => {
    if (folder.split('.').includes('json')) {
      try {
        fs.writeFileSync(`${basePath}/${partnerName}/${folder}`, manifestContent);
        printFolderContents(`${basePath}/${process.argv[2]}`);
      } catch (error) {
        log(chalk.bold.red(error));
      }
    } else {
      try {
        fs.mkdirSync(`${basePath}${partnerName}/${folder}`, { recursive: true });
      } catch (error) {
        log(chalk.bold.red(error));
      }
    }
  });
}

/**
 *
 * Generate Partner file in /client/src/partners directory
 * @param {partnerFile: string, content: string}
 *
 */
function generatePartnerFile(partnerFile, content) {
  const basePath = `${process.cwd()}/src/partners`;
  try {
    fs.writeFileSync(`${basePath}/${partnerFile}`, content);
    log(chalk.bold.blue('Generated files and folders'));
    log(chalk.bold.green(` 🗄  ${process.argv[2]}.js`));
  } catch (error) {
    log(chalk.bold.red(error));
  }
}

generatePartnerFolders(
  process.argv[2], // send the partner name from your package.json file
  ['images', 'img', 'manifest.json'], // folders and manifest.json to be generated
  `{
      "name": "${process.argv[2]}",
      "short_name": "${process.argv[2]}",
      "theme_color": "#04447b",
      "background_color": "#04447b",
      "display": "standalone",
      "Scope": "/",
      "start_url": "/",
      "icons": [
        {
          "src": "./images/icons/icon-72x72.png",
          "sizes": "72x72",
          "type": "image/png"
        },
        {
          "src": "./images/icons/icon-96x96.png",
          "sizes": "96x96",
          "type": "image/png"
        },
        {
          "src": "./images/icons/icon-128x128.png",
          "sizes": "128x128",
          "type": "image/png"
        },
        {
          "src": "./images/icons/icon-144x144.png",
          "sizes": "144x144",
          "type": "image/png"
        },
        {
          "src": "./images/icons/icon-152x152.png",
          "sizes": "152x152",
          "type": "image/png"
        },
        {
          "src": "./images/icons/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": "./images/icons/icon-384x384.png",
          "sizes": "384x384",
          "type": "image/png"
        },
        {
          "src": "./images/icons/icon-512x512.png",
          "sizes": "512x512",
          "type": "image/png"
        }
      ],
      "splash_pages": null
    }
`
);
generatePartnerFile(
  `${process.argv[2]}.js`, // partner file to be generated (/client/src/partners)
  `export default {
  name: '${process.argv[2]}', 
  domain: '${process.argv[2]}',
  id: '5ff3403ce02c9c0001189fc8',
  slug: '${process.argv[2]}',
  path: '/${process.argv[2]}/',
  logo: '/partners/${process.argv[2]}/img/logo.png',
  themes: {
    light: {
      primary: '#04447b',
      secondary: '#26AAE2',
      accent: '#FF5722',
      error: '#f44336',
      warning: '#ffc107',
      info: '#26AAE2',
      success: '#8bc34a',
      appbar: '#FFFFFF',
    },
  },
};`
);
