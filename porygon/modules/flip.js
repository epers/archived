var irccolor = require('irc-colors')
if (require.main === module) {
    var flip = {
        flip: function (message) {
            rand = Math.random();
            if (rand > 0.5) {
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: ["Heads"]
                })
            } else if (rand < 0.5) {
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: ["Tails"]
                })
            } else if (rand == 0.5) {
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: ["Edge"]
                })
            }
        }
    }
    process.on("message", function (message) {
        flip[message.command](message)
    })
} else {

}

module.exports = {
    commands: ["flip"],
}