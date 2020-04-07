# Installation Guide

This guide is for installing on an Amazon EC2 instance.

## Create EC2 instance & keypair

Create and launch Amazon EC2 instance (e.g. ec2.micro Ubuntu 18.04). Make sure to create a keypair (or use an existing one) to be able to login to the instance.

## Install Prerequisites

In AWS console's EC2 running instance tab, right click on your instance, and choose `connect`. It will show you a command for connecting to the instance using your keypair. (You may need to `chmod 600` your keypair)

### Node version manager (nvm) and NodeJS

```
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
$ nvm install node
$ which node
/home/ubuntu/.nvm/versions/node/v13.12.0/bin/node
$ node --version
v13.12.0
```

### Yarn (javascript dependency manager)

Install [yarn](https://yarnpkg.com/)

```
$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
```

Since we are using nvm, we can avoid installing node

```
$ sudo apt update && sudo apt install --no-install-recommends yarn
$ yarn --version
1.22.4
```

### PM2 (process manager for NodeJS)

Install [pm2](https://pm2.keymetrics.io/) globally

```
$ yarn global add pm2
```

This will install pm2 to yarn's global binary directory. We can check the location of this directory with the following command:

```
$ yarn global bin
/home/ubuntu/.yarn/bin
```

Use your favorite text editor and it to the `PATH` variable:

```
$ vim ~/.profile
...
# Add yarn's global binary directory
export PATH="/home/ubuntu/.yarn/bin:$PATH"
```

Now check if pm2 is available (you may need to logout and login again)

```
$ pm2 --version
4.2.3
```

### Clone back-end server (this repository) and front-end client

The back-end and front-end should be within the same folder.

```
$ mkdir -p repos/production
$ cd repos/production

$ git clone https://gitlab.com/our-sci/our-sci-server.git
$ git clone https://gitlab.com/our-sci/our-sci-pwa.git
```

## Adjust environment variables

The default back-end variables are found under [.env.defaults](./env.defaults). You can create a `.env` file which is not commited to source control, and override specific variables.

```
$ cd ~/repos/production/our-sci-server
$ touch .env
$ vim .env
...
PORT=
DATABASE_URL=...
DATABASE_NAME=
```

Front-end environment variables proably do not need to be set, but could be done by creating `.env.production.local` inside `~/repos/production/our-sci-pwa`
