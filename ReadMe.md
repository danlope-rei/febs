[![Build Status](https://travis-ci.org/rei/febs.svg?branch=master)](https://travis-ci.org/rei/febs)

# FEBS

## Summary

`FEBS` is an extensible [webpack](https://webpack.js.org/)\-based [front-end build system](https://engineering.rei.com/frontend/the-rei-front-end-build-system.html) 
designed to be used by a community of front-end developers or a series of projects using a similar set of technologies in order to reduce duplicate effort on build configuration.

Its code falls into two categories

### [Build Features](#build-features)

* [JavaScript](#javascript)
* [Style](#style)
* [Source Maps](#source-maps)
* [Live reloading](#live-reloading)
* [Code Watching](#code-watching)

### [FEBS core](#febs-core)

- [Command-line interface](#command-line-interface)
- [Development and production builds](#production-and-development-builds)
- Produces a [Build Manifest](#build-manifest) so you can insert assets on your page using an [Asset Injector](#asset-injector)

Learn more about [REI's Front-End Build System ](https://engineering.rei.com/frontend/the-rei-front-end-build-system.html)
by checking out the introductory post on the [REI Co-op Engineering blog](https://engineering.rei.com).

## Getting Started

### Install

#### Install the dependency

`npm install --save @rei/febs`

#### Assign build tasks

FEBS exposes an executable named `febs` to be used within the scripts of your `package.json`, e.g:

    "scripts": {
      "build": "febs prod",
      "dev": "febs dev --no-dev-server",
      "live-reload": "febs dev"
      "watch": "febs dev --no-dev-server --watch"
    }

#### Update or use [defaults](#default-configuration) to specify paths for the CSS and JS you want to compile and [run](#run)

See [Command-line Interface](#command-line-interface) for more details and additional ways to run.

## Default Configuration

### Entry points
  - Default JavaScript entry point: `/src/js/entry.js`
  - Default Style entry point: `/src/style/entry.css`

### Output path
  - Bundles written to: `/dist/<packageName>/`.

Given the above defaults, FEBS will generate two bundles at the following paths:

    ./dist/<packageName>/app.1234.js
    ./dist/<packageName>/app.1234.css

You can adjust these default configurations using the [febs configuration](#febs-configuration)

## Build Features

### JavaScript
  - Supports [Vue](https://vuejs.org/) [single file components](https://vuejs.org/v2/guide/single-file-components.html).
  - Transpiles latest JavaScript via [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)
  - Automatically polyfills based on usage and [targeted browsers](https://github.com/rei/febs/blob/babel-polyfills/webpack-config/webpack.base.conf.js#L96).

### Style
  - [Less](http://lesscss.org/) - [deprecated](#deprecation)
  - [Sass/SCSS](https://sass-lang.com/)
  - [PostCSS](https://github.com/postcss)

### Source Maps
Source maps are generated for your bundles via the following [`webpack` methods](https://webpack.js.org/configuration/devtool/):

* dev:  `eval-source-map`
* prod: `source-map`

### Linting
As FEBS is responsible only for *building* your code, it does not provide for linting. You should 
implement a linting step per your style guide as a separate npm task in your `package.json`.

### Code watching
To enable code watching, run:

    febs dev --no-dev-server --watch

### Live reloading
@TODO: additional detail

## FEBS Core

### Command-line interface
FEBS provides a simple command-line interface.

### Production and Development Builds

#### Production Build Task

    febs prod

#### Development Build Task

    febs dev
    febs dev -no-dev-server
    febs dev --no-dev-server --watch

### FEBS Configuration

If the default entry points / output paths don't work for you, you can specify them by using a `febs-config.json` file next to your package.json that is using `febs`.

Here is an example of a entry / output configuration that might be made to use a more Java / Maven like file structure.

*`febs-config.json`*

    {
      "entry": {
        "details": [
          "src/main/js/pages/details/entry.js"
        ],
        "details-reviews": [
          "src/main/js/pages/details/reviews.js"
          "src/main/js/pages/details/write-review.js"
        ]
      }
      "output": {
        "path": "./target/classes/dist"
      }
    }

####  `entry` property

In the `febs-config.json` example above we are creating our own entry points, instead of using the [defaults](#default-configuration). We specify the path where our JavaScript and styles live.

#### `output` property

In the `febs-config.json` example above we change the default output path to the Java classpath where a Java asset injector will be able to read for injection.

#### Example configuration output
Given the above example, FEBS will generate two bundles at the following paths:

    ./target/classes/dist/<packageName>/details.1234.js
    ./target/classes/dist/<packageName>/detail-reviews.1234.js

- `details.1234.js` will only contain JavaScript contained in entry.js (including its dependencies)

- `details-reviews.1234.js` will bundle reviews.js and write-review.js files into one bundle

If you'd like to further configure FEBS, you can look at the [webpack overrides](#webpack-overrides)

### Adding `webpack` loaders

FEBS uses `Webpack` to build and is providing a default Webpack configuration under the hood.

There may be cases where you need to add a loader for your build that isn't provided by default. 
To do this, just create a `webpack.overrides.conf.js` with your loader in your project root. If 
you think others might need the override please file a ticket or reach out for [support]
(#support). Where you can, attempt to avoid using this feature to reduce duplication of work.

    // Webpack.overrides.conf.js
    module.exports = {
      .
      .
      module: {
        rules: [{
          test: '/\.js$/'
          use: {
            loader: 'cool-js-loader'
          }
        }]
      },
      .
      .
      plugins: [
        new CoolPlugin()
      ]
    };
    
You can find out all of the Webpack defaults by reviewing the base
[Webpack configuration file](webpack-config/webpack.base.conf.js).

## Additional Concepts

### Build Manifest

A `febs-manifest.json` is built to `./dist/<packageName>/febs-manifest.json`. This is a
mechanism to be used by an asset injector to insert assets onto a page.

@TODO: Additional detail

### Asset Injector

An asset injector uses a [febs-manifest.json](#build-manifest) to insert production
assets into the markup of a webpage.

See our example JavaScript implementation of the an asset injector. One could
create one to be used by Thymeleaf, Freemarker, JSP Tags, Vue, React, Mustache, Handlebars, etc.

@TODO: publish JavaScript implementation and asset pipeline architectural
diagrams and relate to an "asset pipeline".

## Project Information

### Release management

The project strictly use [semver](https://semver.org/).

The main thing to call out here is that if maintainers (intentionally) introduce
an incompatible Webpack configuration change, the major version is bumped. When
the project moves from Webpack 3 to 4, the major version is bumped.

If the project unintentionally introduces a new bug through a change through
febs core or build features, there will be a prompt fix. Additionally, maintainers
will continue to improve our unit and functional testing strategies and bug
response times.

Somewhat related, the intention is to move the Webpack configuration to a separate
repository and have that be configurable. At that point the project can have more
fine-grained release management and flexibility as well as allow non-internal
customers to have complete control over their shared base configuration.

### Deprecation

When something gets deprecated, it will not be supported in the next major
release but will continue to get [supported](#support) for the previous version.

### Support

The project focus is around FEBS core. For [Build Features](#build-features)
it should be look at as community of practice effort, this is one of the main ideas.
However, a maintainer should be a major contributor to features.

*For our internal customers:* Think of FEBS as just a base Webpack
config that you can edit that happens to be in a different repository

Maintainers support one major version behind and attempt to minimize and group
up major version releases to reduce upgrade/support burden.

#### Internal open source customers

We fully support our internal customers. That means we will respond to Slack
messages and help troubleshoot issues, feature requests, etc.

Feel free to swing by or hit us up on Slack in the #febs-users channel or just file
an issue here :)

#### External open source customers

Maintainers will respond to Github issues within a week for issues with FEBS core.
Unfortunately, there are no guarantees for "immediate" support due to bandwidth.
However, we are happy to collaborate and work together on pull requests. You are
very much welcome and encouraged to fork this project and see where it goes.

Also, we'd love to hear your ideas and feedback on different approaches or similar
solutions in the community that you think could improve FEBS.
