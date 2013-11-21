# MPD Website
[![Build Status](https://travis-ci.org/myplanetdigital/neompd.png?branch=master)](https://travis-ci.org/myplanetdigital/neompd)
[![Code Climate](https://codeclimate.com/github/myplanetdigital/neompd.png)](https://codeclimate.com/github/myplanetdigital/neompd)

## Build & Run

```
npm install
node_modules/.bin/docpad run
```

## Acceptance Testing

Set up webdriver URL (e.g. via Sauce Connect):

```
export WEBDRIVER_URL=http://localhost:4445/
```

Run cucumber:

```
npm run-script cuke
```

## License
Copyright &copy; 2013+ Myplanet Digital. All rights reserved.
