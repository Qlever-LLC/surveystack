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
        {
            "language": "vue",
            "autoFix": true
        },
    ],
}
```

> **NOTE:** This settings file is not commited to git, so feel free to customize.

The above config disables prettier (if installed) as we do not use a .prettierrc config file. Otherwise prettier and eslint keep battling each other... There may be a better approach, but for now this will do.

Furthermore, we recommend using the [Vetur](https://vuejs.github.io/vetur) extension for Visual Studio Code.
