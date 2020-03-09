const irccolor = require('irc-colors')
var core

module.exports = {
    commands: ["tell"],

    db: "tell",

    init: function (_core) {
        core = _core
        core.user_commands["tell"] = module.exports.commands
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.on(command, core.module_listeners[command])
        })
        core.recieveEmitter.on("broadcast", module.exports.listener)
        core.read_db("tell")
    },

    dinit: function () {
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.removeListener(command, core.module_listeners[command])
        })
        core.recieveEmitter.removeListener("broadcast", module.exports.listener)
        core.write_db("tell")
    },

    tell: function (args, message) {
        var reciever = args[0].toLowerCase()
        if (!core.databases.tell[reciever]) {
            core.databases.tell[reciever] = []
        }

        core.databases.tell[reciever].push({
            server: message.server,
            channel: message.reply_to,
            from: message.from,
            tell: args.slice(1).join(' '),
            when: Date.now()
        })

        core.sendEmitter.emit(message.server, {
            command: 'say',
            to: message.reply_to,
            type: message.type,
            text: "Okay"
        })

        core.write_db("tell")
    },

    listener: function (message) {
        var reciever = message.from.toLowerCase()
        if (core.databases.tell[reciever]) {
            core.databases.tell[reciever].forEach(function (entry) {
                var from_server
                var from_channel
                if (entry.server == message.server) {
                    from_channel = `${entry.channel}`
                } else {
                    from_channel = `${entry.server}${entry.channel}`
                }

                if(message.platform == 'irc') {
                    var to_say = `${message.from}: "${irccolor.yellow(entry.tell)}" [${irccolor.red(entry.from)}] [${irccolor.lime(module.exports.readable_time(Date.now() - entry.when))}] [${irccolor.blue(from_channel)}]`
                } else {
                    var to_say = `${message.from}: "${entry.tell}" [${entry.from}] [${module.exports.readable_time(Date.now() - entry.when)}] ${from_channel}`
                }
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: to_say
                })
            })
            delete core.databases.tell[reciever]
            core.write_db("tell")
        }
    },

    readable_time: function (time) {
        var days = Math.floor(time / 86400000),
            hours = Math.floor(time / 3600000) - (days * 24),
            minutes = Math.floor(time / 60000) - (hours * 60) - (days * 1440)
        var readable = ''
        if (time < 60000) {
            readable = "less than a minute"
        } else {
            //Fuck yeah nested ternary operators. Unreadable as hell
            days = (days == 0) ? '' : (days == 1) ? (days + ' day') : (days + ' days')
            hours = (hours == 0) ? '' : (hours == 1) ? (hours + ' hour') : (hours + ' hours')
            minutes = (minutes == 0) ? '' : (minutes == 1) ? (minutes + ' minute') : (minutes + ' minutes')

            if (days != '') {
                days += (hours != '' && minutes != '') ? ', ' : ((hours == '' && minutes != '') || (hours != '' && minutes == '')) ? ' and ' : ''
            }
            if (hours != '' && minutes != '') {
                hours += ' and '
            }
            readable = days + hours + minutes
        }
        return (readable + ' ago')
    },
}