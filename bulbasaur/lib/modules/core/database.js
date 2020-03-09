var fs = require('fs')

var core

module.exports = {
    commands: ['show_db'],

    show_db: function (args, message) {
        if (message.from == core.config.owner) {
            if (core.databases[args[0]]) {
                core.sendEmitter.emit(message.server, {
                    command: 'say',
                    to: message.reply_to,
                    type: message.type,
                    text: JSON.stringify(core.databases[args[0]])
                })
            }
        }
    },
    init: function (_core) {
        core = _core
        core.read_db = module.exports._read_db
        core.write_db = module.exports._write_db
        core.user_commands["db"] = module.exports.commands
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.on(command, core.module_listeners[command])
        })
    },

    dinit: function (_core) {
        core.read_db = false,
            core.write_db = false,
            delete core.user_commands['db']
        module.exports.commands.forEach(function (command) {
            core.module_listeners[command] = module.exports[command]
            core.recieveEmitter.removeListener(command, core.module_listeners[command])
        })
    },

    _read_db: function (db, cb) {
        var path = process.cwd() + `/db/${db}.json`

        // test the path to make sure we can read it
        fs.readFile(path, function (err, data) {
            if (err) {

                core.error("[db]: " + db + " database could not be read.")
                core.error(path)
                core.error(err)
                core.databases[db] = {}
                core.error("[db]: " + db + " database was empty, init'ing")
                module.exports._write_db(db, function (cb) {
                    if (cb) {
                        "[db]: " + db + " database was written sucessfully"
                    }
                })
                if (cb) {
                    cb(false)
                }
                return
            }
            if (data != "undefined") {
                core.databases[db] = JSON.parse(data, "utf8")
                core.log("[db]: " + db + " database loaded.")
            } else {
                core.databases[db] = {}
                core.log("[db]: " + db + " database was empty, init'ing")
            }
            if (cb) {
                cb(true)
            }
        })
    },

    _write_db: function (db, cb) {
        var path = process.cwd() + `/db/${db}.json`
        fs.writeFile(path, JSON.stringify(core.databases[db]), "utf8", function (err) {
            if (err) {
                core.error("[db]: " + db + " database could not be written.")
                core.error(path)
                core.error(err)
                if (cb) {
                    cb(false)
                }
                return
            }
            core.log("[db]: " + db + " database saved.")
        })
        if (cb) {
            cb(true)
        }
    },


}