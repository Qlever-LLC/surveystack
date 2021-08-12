# Surveystack
A monorepo containing the surveystack client and surveystack server.

# Development
## Requirements
  - Node
  - Yarn
  - Mongodb
## Installing Dependencies
  1. Install monorepo root dependencies: `yarn`
  2. Install dependencies of projects within the monorepo: `yarn lerna bootstrap`

## Yarn Scripts / Commands
  - `yarn client:start`: Starts the client
  - `yarn client:test`: Runs tests for the client
  - `yarn client:lint`: Runs the linter for the client
  - `yarn server:start`: Starts the server
