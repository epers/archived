const irccolor = require('irc-colors')
var core

module.exports = {
    commands: [
        "dunno",
        "downy",
        "lv",
        "id",
        "ld",
        "intense",
        "doubledowny",
        "tripppledowny",
        "rainbowdowny",
        "butts"
    ],

    init: function (_core) {
        core = _core
        core.user_commands["emote"] = module.exports.commands
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

    dunno: function (args, message) {
        var faces = [
            "‾\\(ツ)/‾",
            "¯\\(º_o)/¯",
            "¯\\_(シ)_/¯",
            "¯\\_(UwU)_/¯"
        ]

        core.sendEmitter.emit(message.server, {
            command: 'say',
            to: message.reply_to,
            type: message.type,
            text: faces[Math.floor(Math.random() * faces.length)]
        })
    },

    downy: function (args, message) {
        var downy = ".'\x1f/\x1f)"
        core.sendEmitter.emit(message.server, {
            command: 'say',
            to: message.reply_to,
            type: message.type,
            text: downy
        })
    },

    doubledowny: function (args, message) {
        module.exports.downy(args, message)
        module.exports.downy(args, message)
    },

    tripppledowny: function (args, message) {
        module.exports.downy(args, message)
        module.exports.downy(args, message)
        module.exports.downy(args, message)
    },

    rainbowdowny: function (args, message) {
        var downy = ".'\x1f/\x1f)"
        if (message.platform == 'irc') {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: irccolor.rainbow(downy)
            })
        }
    },

    lv: function (args, message) {
        var lv = "♥"
        if (message.platform == 'irc') {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: irccolor.red(lv)
            })
        }
    },

    id: function (args, message) {
        var x = ~~(Math.random() * 4) + 0
        var y = ~~(Math.random() * 999) + 0

        if (y >= 750) {
            var dbladez = [
                'illegal dbladez',
                'I snuck dbladez into prison up my ass.',
                'I love sniffing whole lines of dbladez.',
                'Twenty-five years in prison was worth it for just one hit of dbladez',
                'Taking dbladez ruined my life.'
            ]
            if (message.platform == 'irc') {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: irccolor.bold(dbladez[x])
                })
            } else {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: dbladez[x]
                })
            }
        } else {
            if (message.platform == 'irc') {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: irccolor.bold("illegal drugs")
                })
            } else {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: "illegal drugs"
                })
            }
        }
    },

    ld: function (args, message) {
        var x = ~~(Math.random() * 29) + 0

        if (x == 9) {
            if (message.platform == 'irc') {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: irccolor.bold("There are no legal drugs.")
                })
            } else {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: "There are no legal drugs."
                })
            }
        } else if (x == 19) {
            if (message.platform == 'irc') {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: irccolor.bold("All drugs are illegal.")
                })
            } else {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: "All drugs are illegal."
                })
            }
        } else if (x == 29) {
            if (message.platform == 'irc') {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: irccolor.bold("Your drug use has been logged and reported.")
                })
            } else {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: "Your drug use has been logged and reported."
                })
            }
        } else {
            if (message.platform == 'irc') {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: irccolor.bold("legal drugs\x02")
                })
            } else {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: "legal drugs\x02"
                })
            }
        }
    },

    intense: function (args, message) {
        if (args != '') {
            if (message.platform == 'irc') {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: irccolor.bold("[" + args + " intensifies]")
                })
            } else {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: "[" + args + " intensifies]"
                })
            }
        }
    },

    butts: function (args, message) {
        if (message.platform == 'irc') {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: irccolor.rainbow("(‿ˠ‿) (‿ˠ‿) (‿ˠ‿) (‿ˠ‿)")
            })
        } else {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: "(‿ˠ‿) (‿ˠ‿) (‿ˠ‿) (‿ˠ‿)"
            })
        }
    }
}