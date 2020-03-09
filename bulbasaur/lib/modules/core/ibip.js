var core;

module.exports = {
    init: function (_core) {
        core = _core;
        core.recieveEmitter.on("broadcast", module.exports.ibip);
    },


    dinit: function () {
        core.recieveEmitter.removeListener("broadcast", module.exports.ibip);
    },

    ibip: function (message) {
        if (message.text == '.bots') {
            core.sendEmitter.emit(message.server, {
                command: 'say',
                to: message.reply_to,
                type: message.type,
                text: `Reporting in! [javascript] Porygon, use ${core.config.prefix}help for info`
            });
        }
    }
}