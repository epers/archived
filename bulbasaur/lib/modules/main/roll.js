var irccolor = require('irc-colors')
var core

module.exports = {
    commands: ['roll'],

    init: function (_core) {
        core = _core
        core.user_commands["roll"] = module.exports.commands
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

    roll: function (args, message) {
        var commands = args
        var dieType = 6
        for (var i = 0; i < commands.length; i++) {
            if (commands[i].match(/^d[0-9]*$/)) {
                dieType = commands[i].slice(1)
                commands.splice(i, 1)
            }
        }
        if (dieType > 100) {
            dieType = 100
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "Die size reduced to 100"
            })
        }
        var dice = Math.floor(commands[0].match(/[0-9]*/))
        if (dice > 50) {
            dice = 50
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "Number of rolls reduced to 50"
            })
        }

        var rolls = ''
        var total = 0

        for (i = 0; i < dice; i++) {
            var rand = (Math.floor((Math.random() * dieType) + 1))
            rolls += (rand + " ")
            total += parseInt(rand)
        }

        core.sendEmitter.emit(message.server, {
            command: 'say',
            to: message.reply_to,
            type: message.type,
            text: rolls
        })
        if (dice > 1) {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "Total: " + total
            })
        }
    }
}