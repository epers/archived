'use strict';

module.exports = {
  notify: function(moduleIdent, ipc) {
    function notify(to, message) {
      ipc.send(JSON.stringify({
        'type': 'notification',
        'version': 1,
        'from': moduleIdent,
        'to': to,
        'message': message
      }), to);
    }
    return notify;
  },

  registerCommands: function(moduleIdent, ipc) {
    function registerCommands(subscriptions, adminCommands) {
      setTimeout(() => {
        // tell router what commands we want to hear
        ipc.send(JSON.stringify({
          'type': 'subscribe',
          'version': 1,
          'origModule': moduleIdent,
          'fromModule': moduleIdent,
          'toModule': 'router',
          'subscriptions': subscriptions
        }), 'router');
        // tell admin what commands we want to hear
        ipc.send(JSON.stringify({
          'type': 'subscribe',
          'version': 1,
          'origModule': moduleIdent,
          'fromModule': moduleIdent,
          'toModule': 'admin',
          'adminCommands': adminCommands
        }), 'admin');
      }, 1000);
    }
    return registerCommands;
  }
};
