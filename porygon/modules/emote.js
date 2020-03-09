const irccolor = require('irc-colors')

if (require.main === module) {
    var emote = {
        dunno: function (message) {
            var faces = [
                "‾\\(ツ)/‾",
                "¯\\(º_o)/¯",
                "¯\\_(シ)_/¯",
                "¯\\_(UwU)_/¯"
            ]

            process.send({
                direction: "out",
                server: message.server,
                type: "chanmsg",
                target: message.reply_to,
                text: [faces[Math.floor(Math.random() * faces.length)]]
            })
        },

        downy: function (message) {
            var downy = ".'\x1f/\x1f)"
            process.send({
                direction: "out",
                server: message.server,
                type: "chanmsg",
                target: message.reply_to,
                text: [downy]
            })
        },

        doubledowny: function (message) {
            emote.downy(message)
            emote.downy(message)
        },

        tripppledowny: function (message) {
            emote.downy(message)
            emote.downy(message)
            emote.downy(message)
        },

        rainbowdowny: function (message) {
            var downy = ".'\x1f/\x1f)"
            if (message.platform == 'irc') {
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: [irccolor.rainbow(downy)]
                })
            }
        },

        lv: function (message) {
            var lv = "♥"
            if (message.platform == 'irc') {
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: [irccolor.red(lv)]
                })
            }
        },

        id: function (message) {
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
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: [irccolor.bold(dbladez[x])]
                    })
                } else {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: [dbladez[x]]
                    })
                }
            } else {
                if (message.platform == 'irc') {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: [irccolor.bold("illegal drugs")]
                    })
                } else {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: ["illegal drugs"]
                    })
                }
            }
        },

        ld: function (message) {
            var x = ~~(Math.random() * 29) + 0
            if (x == 9) {
                if (message.platform == 'irc') {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: [irccolor.bold("There are no legal drugs.")]
                    })
                } else {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: ["There are no legal drugs."]
                    })
                }
            } else if (x == 19) {
                if (message.platform == 'irc') {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: [irccolor.bold("All drugs are illegal.")]
                    })
                } else {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: ["All drugs are illegal."]
                    })
                }
            } else if (x == 29) {
                if (message.platform == 'irc') {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: [irccolor.bold("Your drug use has been logged and reported.")]
                    })
                } else {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: ["Your drug use has been logged and reported."]
                    })
                }
            } else {
                if (message.platform == 'irc') {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: [irccolor.bold("legal drugs\x02")]
                    })
                } else {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: ["legal drugs"]
                    })
                }
            }
        },

        intense: function(message) {
            if (message.args != '') {
                if (message.platform == 'irc') {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: [irccolor.bold("[" + message.args.join(' ') + " intensifies]")]
                    })
                } else {
                    process.send({
                        direction: "out",
                        server: message.server,
                        type: "chanmsg",
                        target: message.reply_to,
                        text: ["[" + message.args.join(' ') + " intensifies]"]
                    })
                }
            }
        },

        butts: function(message) {
            if (message.platform == 'irc') {
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: [irccolor.rainbow("(‿ˠ‿) (‿ˠ‿) (‿ˠ‿) (‿ˠ‿)")]
                })
            } else {
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: ["(‿ˠ‿) (‿ˠ‿) (‿ˠ‿) (‿ˠ‿)"]
                })
            }
        }
    }
    process.on("message", function (message) {
        console.log(message)
        emote[message.command](message)
    })
} else {

}

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
}