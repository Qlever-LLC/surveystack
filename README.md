## Run locally

Make sure a local mongodb server is running.

```
# switch to server directory
cd our-sci-erver
# install packages
yarn
# start server
yarn start
```

By default, the server will run on [http://localhost:3000](http://localhost:3000). You can change default port settings, mongodb server, etc. by copying the [.env.defaults](./.env.defaults) file.

```
cp .env.defaults .env
```

... and then adjusting .env accordingly. Note that .env will not be commited to git.

## Run on webserver

On the current webserver, it is run with node process manager [pm2](http://pm2.keymetrics.io/).

```
# example commands
pm2 start "yarn prod" --name "surveystack-production"
pm2 list
pm2 stop surveystack-production
pm2 start surveystack-production
pm2 describe surveystack-production
# keep process list on reboot
pm2 startup
pm2 save
```

## Links

[Express Nodejs](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes)
