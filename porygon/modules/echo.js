if (require.main === module) {
    var echo = {
        echo: function (message) {
            process.send({
                direction: "out",
                server: message.server,
                type: "chanmsg",
                target: message.reply_to,
                text: message.args
            })
        }
    }
    process.on("message", function (message) {
        echo[message.command](message)
    })
} else {

}

module.exports = {
    commands: ["echo"],
}
