'use strict';
// init starts all "start-at-boot" modules and manages running modules
const fs = require('fs');
const fork = require('child_process').fork;

const moduleIdent = 'init';

const config = require(`${process.cwd()}/lib/config.js`).config(moduleIdent);
const log = require(`${process.cwd()}/lib/log.js`).logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
const ipc = require(`${process.cwd()}/lib/ipc.js`).ipc(moduleIdent, log);
const registerCommands = require(`${process.cwd()}/lib/common.js`).registerCommands(moduleIdent, ipc);

ipc.on('message', handleIpcMessage);

const subscriptions = [];
const adminCommands = ['init'];
registerCommands(subscriptions, adminCommands);

const children = {};

// gather up the list of core modules to load on boot  initCoreModules
log.info(`Core init modules: ${JSON.stringify(config.initCoreModules, null, '  ')}`);
config.initCoreModules.forEach((ident) => {
  children[ident] = fork(`${process.cwd()}/modules/${ident}.js`);
});

// we want to sleep for half a shake to make sure router/admin are loaded and listening for registrations
// TODO: come back one day and implement proper dependency checking.
setTimeout(() => {
  // fork off our children
  log.info(`init modules: ${JSON.stringify(config.initModules, null, '  ')}`);
  config.initModules.forEach((ident) => {
    children[ident] = fork(`${process.cwd()}/modules/${ident}.js`);
  });
}, 500);

function handleIpcMessage(data) {
  const message = JSON.parse(data.message.toString());
  // make sure we only act on the first arg
  // TODO come back and let us start/stop/restart multiple modules at once?
  log.debug(JSON.stringify(message, null, '  '));

  switch (message.type) {
    default: {
      return 0; // bail out if we get an invalid command
    }
    case 'controlMessage': {
      handleControlMessage(message);
      return 0;
    }
  }
}

function handleControlMessage(message) {
  const command = message.args.split(' ')[0];
  const args = message.args.split(' ').slice(1);
  const validCommands = ['restartSelf', 'restart', 'start', 'stop', 'status'];
  if (validCommands.includes(command)) {
    const output = functions[command](args[0]);
    if (message.notify) {
      ipc.send(JSON.stringify({
        'type': 'notification',
        'version': 1,
        'fromModule': moduleIdent,
        'toModule': message.notify,
        'channel': message.origMessage.channel,
        'text': output.humanReadable,
        'command': command,
        'args': args,
        'result': output.result,
        'err': output.error,
      }), message.notify);
      return 0;
    }
    return 0;
  }
  return 0;
}

const functions = {
  restartSelf: function() {
    // TODO: this
    // we'll need to:
    // switch to tracking/killing children via pid instead of nodejs child object
    // have a pid/ folder where each module writes their pid
  },

  restart: function(childIdent) {
    let error = null;
    let result = null;
    let humanReadable = null;

    if (typeof children[childIdent] !== 'undefined') {
      try {
        log.debug(`[restart] Restarting module [${childIdent}`);
        children[childIdent].kill('SIGTERM');
        children[childIdent] = fork(`${process.cwd()}/modules/${childIdent}.js`);
        result = true;
        humanReadable = [
          { 'text': 'Module [' },
          { 'text': childIdent, 'color': 'blue' },
          { 'text': '] restarted successfully' },
        ];
      } catch (err) {
        log.error(`[restart] Error ${JSON.stringify(err, null, '  ')}`);
        error = err;
        result = false;
        humanReadable = [
          { 'text': 'Module [' },
          { 'text': childIdent, 'color': 'red' },
          { 'text': `] restart failed: ${error.message}` }
        ];
      }
    } else {
      log.error(`[restart] Module ${childIdent} is not loaded`);
      error = new Error(`[restart] Module ${childIdent} is not loaded`);
      result = false;
      humanReadable = [
        { 'text': 'Module [' },
        { 'text': childIdent, 'color': 'red' },
        { 'text': '] is not loaded' }
      ];
    }
    return {
      'error': error,
      'result': result,
      'humanReadable': humanReadable
    };
  },

  start: function(childIdent) {
    let error = null;
    let result = null;
    let humanReadable = null;
    if (typeof children[childIdent] === 'undefined') {
      const path = `${process.cwd()}/modules/${childIdent}.js`;
      try {
        fs.accessSync(path, fs.constants.R_OK);
        children[childIdent] = fork(`${process.cwd()}/modules/${childIdent}.js`);
        result = true;
        humanReadable = [
          { 'text': 'Module [' },
          { 'text': childIdent, 'color': 'blue' },
          { 'text': '] started successfully' }
        ];
      } catch (err) {
        result = false;
        error = err;
        log.error(`[start] ${path} does not exist`);
        humanReadable = [
          { 'text': 'Module [' },
          { 'text': childIdent, 'color': 'red' },
          { 'text': `] start failed: ${error.message}` }
        ];
      }
    } else {
      log.error(`[start] ${childIdent} is already running`);
      error = new Error(`[start] Module ${childIdent} is already running`);
      result = false;
      humanReadable = [
        { 'text': 'Module [' },
        { 'text': childIdent, 'color': 'red' },
        { 'text': `] start failed: ${error.message}` }
      ];
    }
    return {
      'error': error,
      'result': result,
      'humanReadable': humanReadable
    };
  },

  stop: function(childIdent) {
    let error = {};
    let result = null;
    let humanReadable = null;

    if (typeof children[childIdent] !== 'undefined') {
      log.debug(`[stop] Sending SIGTERM to module [${childIdent}`);
      children[childIdent].kill('SIGTERM');
      delete children[childIdent];
      result = true;
      humanReadable = [
        { 'text': 'Module [' },
        { 'text': childIdent, 'color': 'blue' },
        { 'text': '] stopped successfully' }
      ];
    } else {
      log.error(`[stop] Module ${childIdent} is not loaded`);
      error = new Error(`[stop] Module ${childIdent} is not loaded`);
      result = false;
      humanReadable = [
        { 'text': 'Module [' },
        { 'text': childIdent, 'color': 'red' },
        { 'text': '] is not loaded' }
      ];
    }
    return {
      'error': error,
      'result': result,
      'humanReadable': humanReadable
    };
  },

  status: function(childIdent) {
    const error = {};
    let result = null;
    let humanReadable = null;

    if (typeof childIdent !== 'undefined') {
      // show status about child
    } else {
      const loadedModules = [];
      Object.keys(children).forEach((key) => {
        loadedModules.push(key);
        humanReadable.push(`${key}[${children[key].pid}]`);
      });
      result = true;
      humanReadable.toString().replace(/,/g, ', ');
      humanReadable = `Currently running modules: [${humanReadable}]`;
    }
    return {
      'error': error,
      'result': result,
      'humanReadable': humanReadable
    };
  }
};
