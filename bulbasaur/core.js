const fork = require('child_process').fork
const fs = require('fs')
const events = require('events')

// setup module loading/unloading
var core = {
    modules_loaded: {},
    module_listeners: [],
    databases: {},
    user_commands: {},

    recieveEmitter: new events.EventEmitter(),
    sendEmitter: new events.EventEmitter(),
    commandEmitter: new events.EventEmitter(),

    config: require(process.cwd() + '/etc/core.js'),

    // middleman functions for stuff that's handled by external modules
    read_db: false,
    write_db: false,

    ignore: false,


    init: function () {
        core.config.modules.forEach(function (module) {
            core.load_module(module)
        })
    },

    log: function (message) {
        console.log(message)
    },

    error: function (message) {
        console.error(message)
    },

    parse_message: function (message) {
        // emit an event with the message for stuff like url title module
        console.log(message);
        core.recieveEmitter.emit("broadcast", message)

        // if it's a command find out what command and arguments were provided so we can handle them
        if (message.text.slice(0, core.config.prefix.length) == core.config.prefix) {
            var command = message.text.slice(core.config.prefix.length).split(' ')[0]
            var args = message.text.slice(core.config.prefix.length).split(' ').slice(1)
            core.recieveEmitter.emit([command], args, message)
        }
    },

    load_module: function (ident, cb) {
        try {
            path = process.cwd() + '/lib/modules/' + ident + '.js'
            
            // make sure the file exists
            fs.readFile(path, function (err) {
                if (err) {
                    core.err(`module ${ident} could not be read`)
                    if (cb) {
                        cb(false)
                    }
                    return
                }
            })
            if (core.modules_loaded[ident]) {
                core.error("module " + ident + " already loaded")
                if (cb) {
                    cb(false)
                }
                return
            }
            core.modules_loaded[ident] = require(path)
            if (typeof core.modules_loaded[ident].init == 'function') {
                core.modules_loaded[ident].init(core)
            }
            if (core.modules_loaded[ident].db) {
                core.read_db(core.modules_loaded[ident].db)
            }
            if (cb) {
                cb(true)
            }
            return
        } catch (error) {
            delete core.modules_loaded[ident]
            
            core.error(error)
            if (cb) {
                cb(false)
            }
        }
    },

    unload_module: function (ident) {
        try {
            if (typeof core.modules_loaded[ident].dinit == 'function') {
                core.modules_loaded[ident].dinit()
            }
            path = process.cwd() + '/lib/modules/' + ident + '.js'
            delete core.modules_loaded[ident]
            delete require.cache[path]
        } catch (error) {
            core.error(error)
        }
    }
}

/* core.recieveEmitter.on("broadcast", function(message) {
    console.log(message)
}) */

core.init()