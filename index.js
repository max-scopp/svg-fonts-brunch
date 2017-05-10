'use strict';

const webfontsGenerator = require('webfonts-generator');
const anymatch = require('anymatch');
const glob = require('glob');
const sysPath = require('path');
const _ = require('lodash');
const writefile = require('writefile');
const loggy = require('loggy');

const pkg = require(process.cwd() + '/brunch-config')

const defaultOptions = {
  fontName: 'auw-icons',
  writeFiles: false,
	cssTemplate: sysPath.resolve(process.cwd(), __dirname, './scss-template.hbs'),
}

// Documentation for Brunch plugins:
// http://brunch.io/docs/plugins

// Remove everything your plugin doesn't need.
class WebIcons {
  constructor (config) {
    // Replace 'plugin' with your plugin's name;
    this.config = config.plugins.webIcons || {};
    this.compiled = false;
  }

  // file: File => Promise[Boolean]
  // Called before every compilation. Stops it when the error is returned.
  // Examples: ESLint, JSHint, CSSCheck.
  // lint(file) { return Promise.resolve(true); }

  // file: File => Promise[File]
  // Transforms a file data to different data. Could change the source map etc.
  // Examples: JSX, CoffeeScript, Handlebars, SASS.
  compile (file) {
    return new Promise((resolve, reject) => {
      if (!this.compiled) {
        glob('**/*.svg', (err, sourceFiles) => {
          if (err) reject(err)

          _.forEach(this.config.files, (arr, target) => {
            let [sourceAnymatch, scssTarget] = arr;

            let myFiles = sourceFiles.filter(anymatch(sourceAnymatch));
            let targetFolder = sysPath.dirname(target);
            let targetBasename = sysPath.basename(target)

            let opts = _.extend(defaultOptions, {
              files: myFiles,
              dest: targetFolder,
              fontName: targetBasename,
              types: this.config.types
            })

            loggy.info('Generating ' + target)
            webfontsGenerator(opts, (error, result) => {
              if (error) reject(error);

              const ret = result;
              ret.data = result.svg;

              let fonts = {};

              _.forEach(opts.types, (type) => {
                let targetResolved = sysPath.resolve(process.cwd(), pkg.paths.public, target + '.' + type)
                loggy.info(`Writing Icon-Font ${sysPath.relative(process.cwd(), targetResolved)}`)
                writefile(targetResolved, result[type])
                fonts[type] = '/' + sysPath.relative(process.cwd(), targetResolved);
              })

              let css = result.generateCss(fonts)
              writefile(sysPath.resolve(process.cwd(), pkg.paths.public, scssTarget), css)

              resolve(ret);
            })
          })
        })
      } else {
        resolve({data: ''})
      }

      this.compiled = true;
    })
  }

  // files: [File] => null
  // Executed when each compilation is finished.
  // Examples: Hot-reload (send a websocket push).
  onCompile (files) {
    this.compiled = false;
  }

  // Allows to stop web-servers & other long-running entities.
  // Executed before Brunch process is closed.
  // teardown() {}
}

// Required for all Brunch plugins.
WebIcons.prototype.brunchPlugin = true;

// Required for compilers, linters & optimizers.
// 'javascript', 'stylesheet' or 'template'
WebIcons.prototype.type = 'template';

// Required for compilers & linters.
// It would filter-out the list of files to operate on.
// BrunchPlugin.prototype.extension = 'js';
WebIcons.prototype.extension = 'svg';
//WebIcons.prototype.pattern = /\.svg$/;

// Indicates which environment a plugin should be applied to.
// The default value is '*' for usual plugins and
// 'production' for optimizers.

module.exports = WebIcons;
