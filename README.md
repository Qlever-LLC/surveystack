# Our-Sci PWA

Our-Sci PWA is a Progressive Web App (PWA) for creating and collecting surveys.

## Coding guidelines

Our-Sci PWA adheres to airbnb coding style guidelines. For development, we recommend using Visual Studio Code with the following workspace settings under `.vscode/settings.json`:

```
{
    "prettier.requireConfig": true,
    "eslint.run": "onType",
    "eslint.autoFixOnSave": true,
    "eslint.validate": [
        "javascript",
        {
            "language": "vue",
            "autoFix": true
        },
    ],
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "vetur.format.defaultFormatter.js": "vscode-typescript",
    "vetur.format.defaultFormatter.html": "js-beautify-html",
}
```

> **NOTE:** This settings file is not commited to git, so feel free to customize.

The above config disables prettier (if installed) as we do not use a .prettierrc config file. Otherwise prettier and eslint keep battling each other... There may be a better approach, but for now this will do. Also you may need to **disable Prettier for this workspace** since there is currently (Jan 2020) a bug, where Prettier formatting is applied anyhow even though there is no prettier config file.

Furthermore, we recommend using the [Vetur](https://vuejs.github.io/vetur) extension for Visual Studio Code. We are using the following settings **Default Formatters** for Vetur (vetur.format.defaultFormatter)
- CSS = prettier
- HTML = **js-beautify-html**
- JS = prettier
- LESS = prettier
- Postcss = prettier
- SCSS = prettier
- Stylus = stylus-supremacy
- TS = prettier


## Vuetify

This project uses Vuetify 

Have a look at the official [documentation on application](https://vuetifyjs.com/en/components/application) to see how the following components work together:
- [v-app-bar](https://vuetifyjs.com/components/app-bars)
- [v-bottom-navigation](https://vuetifyjs.com/components/bottom-navigation)
- [v-footer](https://vuetifyjs.com/components/footer)
- [v-navigation-drawer](https://vuetifyjs.com/components/navigation-drawers)
- [v-system-bar](https://vuetifyjs.com/components/system-bars)

Basically, the following layout is used:
![vuetify application layout](./src/assets/documentation/vuetify-app.png)