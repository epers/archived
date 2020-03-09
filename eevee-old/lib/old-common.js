'use strict';
// common stuff in here
const fs = require('fs');

const ourModuleIdent = 'common';

const ourPath = `${process.cwd()}/etc/${ourModuleIdent}.js`;

let ourConfig = null;
let ourLog = null;

try {
  fs.accessSync(ourPath, fs.constants.R_OK);
  ourConfig = require(`${process.cwd()}/etc/${ourModuleIdent}.js`);
  ourLog = require(`${process.cwd()}/lib/log.js`).logger(ourConfig.consoleLogLevel, ourConfig.fileLogLevel, ourModuleIdent);
  ourLog.debug(`${ourModuleIdent} config: ${JSON.stringify(ourConfig, null, '  ')}`);
} catch (err) {
  ourLog = require(`${process.cwd()}/lib/log.js`).logger('silly', 'error', ourModuleIdent);
}

module.exports = function(moduleIdent, enableParam) {
  // set defaults
  const enable = {
    ipc: true,
    ipcRpc: false,
    config: true,
    log: true
  };

  let config = null;
  let ipc = null;
  let log = null;

  // did we pass a parameter at all?
  if (typeof enableParam !== 'undefined') {
    // did we pass a ipc parameter?
    if (typeof enableParam.ipc !== 'undefined') {
      if (enableParam.ipc) {
        // if we're enabling ipc, we need to disable ipcRpc
        enable.ipc = true;
        enable.ipcRpc = false;
      } else {
        enable.ipc = false;
      }
    } else {
      enable.ipc = true;
    }

    // did we pass a ipcRpc parameter?
    if (typeof enableParam.ipcRpc !== 'undefined') {
      if (enableParam.ipcRpc) {
        // if we're enabling ipcRpc, we need to disable ipc
        enable.ipc = false;
        enable.ipcRpc = true;
      } else {
        enable.ipcRpc = false;
      }
    } else {
      enable.ipcRpc = false;
    }

    // did we pass a config parameter?
    if (typeof enableParam.config !== 'undefined') {
      if (enableParam.config) {
        enable.config = true;
      } else {
        enable.config = false;
      }
    } else {
      enable.config = true;
    }

    // did we pass a log parameter?
    if (typeof enableParam.log !== 'undefined') {
      if (enableParam.log) {
        enable.log = true;
      } else {
        enable.log = false;
      }
    } else {
      enable.log = true;
    }
  }

  if (enable.config) {
    try {
      if (typeof enableParam !== 'undefined') {
        if (typeof enableParam.configFileOverride !== 'undefined') {
          const path = `${process.cwd()}/etc/${enableParam.configFileOverride}.js`;
          fs.accessSync(path, fs.constants.R_OK);
          config = require(`${process.cwd()}/etc/${enableParam.configFileOverride}.js`);
        }
      } else {
        const path = `${process.cwd()}/etc/${moduleIdent}.js`;
        fs.accessSync(path, fs.constants.R_OK);
        config = require(`${process.cwd()}/etc/${moduleIdent}.js`);
      }
      const logger = require(`${process.cwd()}/lib/log.js`);
      log = new logger.logger(config.consoleLogLevel, config.fileLogLevel, moduleIdent);
      ourLog.debug(`${moduleIdent} config: ${JSON.stringify(config, null, '  ')}`);
    } catch (err) {
      const logger = require(`${process.cwd()}/lib/log.js`);
      log = new logger.logger('debug', 'error', moduleIdent);
      ourLog.info(`No configuration provided for module [${moduleIdent}]: ${err}`);
    }
  } else {
    // TODO: come back and set this to notice later
    log = require(`${process.cwd()}/lib/log.js`).logger('debug', 'error', moduleIdent);
  }

  if (enable.ipc) {
    const ipcNetwork = require('ipc-network');
    ipc = new ipcNetwork.IpcNetwork(moduleIdent);
    ipc.on('error', (error) => {
      log.error(`IPC Error: ${JSON.stringify(error, null, '  ')}`);
    });
    ipc.on('message', (data) => {
      const from = JSON.parse(data.message.toString()).origModule;
      log.debug(`IPC Message: [${data.from}] => [${from}] ${JSON.stringify(JSON.parse(data.message.toString()), null, '  ')}`);
    });
    ipc.startListening();
  }

  function notify(controlMessage, message, err) {
    ipc.send(JSON.stringify({
      'type': 'notification',
      'version': 1,
      'message': message,
      'error': err,
      'sender': moduleIdent,
      'controlMessage': controlMessage
    }), controlMessage.notify);
  }

  return {
    ipc: ipc,
    log: log,
    config: config,
    notify: notify
  };
};
