const mathjs = require('mathjs')

if (require.main === module) {
    var calc = {
        c: function (message) {
            args = message.args.join(' ');
            var parser = mathjs.parser();
            try {
                var to_say = [mathjs.format(parser.eval(args), {
                    precision: 14
                }).replace("undefined", "Error parsing input")]
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: to_say
                })
            } catch (e) {
                process.send({
                    direction: "out",
                    server: message.server,
                    type: "chanmsg",
                    target: message.reply_to,
                    text: ["Error parsing input."]
                })
            }
        }
    }
    process.on("message", function (message) {
        calc[message.command](message)
    })
} else {

}

module.exports = {
    commands: ["c"],
}