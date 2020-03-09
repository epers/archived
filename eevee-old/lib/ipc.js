'use strict';
const ipcNetwork = require('ipc-network');

module.exports = {
  ipc: function(moduleIdent, log) {
    const ipc = new ipcNetwork.IpcNetwork(moduleIdent);
    ipc.on('error', (error) => {
      log.error(`IPC Error: ${JSON.stringify(error, null, '  ')}`);
    });
    ipc.on('message', (data) => {
      const message = JSON.parse(data.message.toString());
      const to = message.toModule;
      const from = message.fromModule;
      log.debug(`IPC Message: [${from}] => [${to}] ${JSON.stringify(message, null, '  ')}`);
    });
    ipc.startListening();
    return ipc;
  },
};
