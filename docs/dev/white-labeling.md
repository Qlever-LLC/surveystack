# Steps to whtie label application

## Domain / Operations

- create new CNAME entry pointing to AWS, (deprecated, has wildcard now)
- create Loadbalancer Entry pointing to production in EC2 (deprecated, has wildcard now)


## Customizing

- create `icon.svg` in `public/partners/<partner>/`
- change into directory
- run `../gen-icon.sh icon.svg` to generate scaled versions
- run `../gen-hero.sh hero.svg` to generate scaled hero image
- Store in `public/partners` (create subfolder matching subdomain)
- Add new `js` in `src/partners`.