# hello-world
**Simple 'Hello World' app to illustrate the basics**

* Tech Stack
  * [StackShare](https://stackshare.io) [![Stack Share](http://img.shields.io/badge/tech-stack-0690fa.svg?style=flat)](http://stackshare.io/n8io/utopias)
* Requirements
  * [NodeJs](https://nodejs.org) ![NodeJs Version](http://img.shields.io/badge/node-^4.2-blue.svg)
* Builds
  * [Travis CI](https://travis-ci.org) [![Travis CI Build Status](https://img.shields.io/travis/utopias/hello-world/develop.svg)](https://travis-ci.org/utopias/hello-world)
  * [Circle CI](https://circleci.com) [![Circle CI Build Status](https://img.shields.io/circleci/project/utopias/hello-world/develop.svg)](https://circleci.com/gh/utopias/hello-world/tree/develop)
* Dependencies
  * [David DM](https://david-dm.org) ![NPM Dependencies](https://david-dm.org/utopias/hello-world/develop.svg)
* Code Coverage
  * [Coveralls](https://coveralls.io) [![Coverage Status](https://img.shields.io/coveralls/utopias/hello-world/develop.svg)](https://coveralls.io/github/utopias/hello-world?branch=develop)
  * [CodeCov](https://codecov.io) [![CodeCov Code Coverage](https://img.shields.io/codecov/c/github/utopias/hello-world/develop.svg)](https://codecov.io/github/utopias/hello-world?branch=develop)
* Code Health
  * [bitHound](https://bithound.io) [![bitHound Score](https://www.bithound.io/github/utopias/hello-world/badges/score.svg)](https://www.bithound.io/github/utopias/hello-world)


## Getting started
1. `npm install`

## Developing
1. `npm run dev`

## Code Coverage
1. `npm run coverage`

## Code Linting
1. `npm run lint`

## Docker

### Prerequisites
1. Make sure you have the latest Docker Toolbox installed.
1. Make sure you have ran `npm install`

### Dockerizing
1. `npm run build:docker && npm run docker`
1. `open http://$(docker-machine ip <YOUR_DOCKER_MACHINE_NAME>)`
1. You should see `Hello world!`

View [change log](CHANGELOG.md)
