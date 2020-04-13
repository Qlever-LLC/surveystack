# Installation Guide

This guide is for installing the back-end and front-end on an Amazon EC2 instance, using a MongoDB database hosted on [cloud.mongodb.com](https://cloud.mongodb.com/).

## Setup MongoDB on cloud.mongodb.com

Login to [cloud.mongodb.com](https://cloud.mongodb.com/) and start a new project, e.g. `surveystack`, and create a cluster for it. Then under _ATLAS > Clusters_ choose **Connect**. If not done already, you will need to create an initial admin user and whitelist IPs from where your cluster will be available. Proceed to choose **Connect to your application** with Driver **Node.js** and take note of the **Connection String displayed**. (We will need this connection string later on when configuring the database connection through the environment variable `DATABASE_URL`)

## Create AWS EC2 instance & keypair

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

The default back-end variables are found under [.env.defaults](./env.defaults). You can create a `.env` file which is not commited to source control, and override specific variables (use your MongoDB connection string from the beginning of this installation guide).

```
$ cd ~/repos/production/our-sci-server
$ touch .env
$ vim .env
...
PORT=3100
DATABASE_URL=<mongodb-connection-string>
DATABASE_NAME=surveystack-production
```

Front-end environment variables proably do not need to be set, but could be done by creating `.env.production.local` inside `~/repos/production/our-sci-pwa`

## PM2 configuration

```
$ cd repos/production/our-sci-server
$ yarn
```

If yarn fails, you may need to install additional packages:

```
$ sudo apt-get update
$ sudo apt-get install build-essential
```

Now initialize the pm2 startup script

```
$ pm2 startup
```

... which will print a command to be executed.

We can now proceed to start the server through pm2, and also make sure to **save** the list of application so that it will **auto-start on boot**.

```
$ pm2 start "yarn prod" --name "surveystack-production"
$ pm2 list
$ pm2 save
```

## Amazon & DNS Configuration

### Create Load Balancer & Target Group

Create an **application** load balancer under _Compute > EC2 > Load Balancing_... Furthermore, create a target group, e.g. `tg-surveystack-production` like so:

```
name: tg-surveystack-production
type: instance
protocol: HTTP
port: 3100
VPC: (default)
```

### Certificate

Navigate to AWS **Certificate Manger** and choose **Request a certificate**, then proceed to create a certificate, e.g.

```
Domain name: surveystack.io
Additional names: *.surveystack.io
```

### DNS configuration

Inside AWS Load Balancer, take note of your **load balancer's DNS name (A record)**.
Copy this DNS name (e.g. `lb-allround-1734767466.us-east-1.elb.amazonaws.com.`) and login to your domain's DNS configuration. Now create a CNAME for your desired subdomain e.g. `app.surveystack.io`, like so:

```
type=CNAME
host=app
value=lb-allround-1734767466.us-east-1.elb.amazonaws.com
```

### Load Balancer configuration

Select your load balancer and switch to the listeners tab. Add a new `HTTPS:443` listener. Add your certificate, e.g. `*.surveystack.io`, and then edit **Rules** for this listener.

Add a new rule with condition **Host Header** and a value of your desired subdomain, e.g. `app.surveystack.io`. In that case, forward to your target group, e.g. `tg-surveystack-production`.

### Add instance targets to your target group

Inside AWS console, switch to **EC2 > Target groups** and select your target group (e.g. `tg-surveystack-production`). Switch to the **Targets** tab, and add your running EC2 instance as a registered target group.
