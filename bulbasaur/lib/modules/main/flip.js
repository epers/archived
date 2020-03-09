var irccolor = require('irc-colors')
var core

module.exports = {
    commands: ['flip'],

    init: function (_core) {
        core = _core
        core.user_commands["flip"] = module.exports.commands
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.on(command, core.module_listeners[command])
        })
    },

    dinit: function () {
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.removeListener(command, core.module_listeners[command])
        })
    },

    flip: function (args, message) {
        rand = Math.random();
        if (rand > 0.5) {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "Heads"
            })
        } else if (rand < 0.5) {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "Tails"
            })
        } else if (rand == 0.5) {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "Edge"
            })
        }
    }
}