// *** Normal Messages ***

// connector -> core
var INCOMINGMESSAGE = {
  event: "INCOMINGMESSAGE",
  type: "chanmsg",
  fromPlatform: "irc",
  fromServer: "irc.wetfish.net",
  fromChannel: "#botspam",
  fromNick: "Weazzy",
  message: "<echo foo",
  timestamp: Date.now(), // maybe later we'll come back and track performance
  raw: { // untouched message from the IRC library
    "type": "privmsg", // channel messages will show as privmsg's - need to parse them out to determine chanmsg vs privmsg
    "nick": "Weazzy",
    "ident": "Weazzy",
    "hostname": "Fish-hv1.ceo.172.163.IP",
    "target": "#totodile",
    "message": "<echo foo bar",
    "tags": {},
  }
}
ipc.of.core.emit("INCOMINGMESSAGE", INCOMINGMESSAGE); // pass it into core

// core -> router
var TOROUTER = INCOMINGMESSAGE
ipc.server.emit(messageRouterSocket, "TOROUTER", TOROUTER); // pass it to the router

// router -> core
var FROMROUTER = {
  event: "FROMROUTER",
  type: "chanmsg",
  toModule: "echo", // what module core should send the message to
  command: "echo",
  args: ["foo", "bar"],
  fromPlatform: "irc",
  fromServer: "irc.wetfish.net",
  fromChannel: "#botspam",
  fromNick: "Weazzy",
  message: "<echo foo bar",
  timestamp: Date.now(),
  raw: { // untouched message from the IRC library
    "type": "privmsg",
    "nick": "Weazzy",
    "ident": "Weazzy",
    "hostname": "Fish-hv1.ceo.172.163.IP",
    "target": "#totodile",
    "message": "<echo foo",
    "tags": {},
  }
}
ipc.of.core.emit("FROMROUTER", FROMROUTER)

// core -> module
var TOMODULE = FROMROUTER // for readability
toModule.emit("TOMODULE", TOMODULE); // this is picked up below, within the subscribe event

// module -> core
var FROMMODULE = {
  event: "OUTGOINGMESSAGE",
  type: "chanmsg",
  toPlatform: "irc",
  toServer: "irc.wetfish.net",
  toChannel: "#botspam",
  fromModule: "echo",
  message: "Echo: foo bar",
  timestamp: Date.now()
}
ipc.of.core.emit("FROMMODULE", FROMMODULE)

// core -> connector
var TOSERVER = {
  event: "OUTGOINGMESSAGE",
  type: "chanmsg",
  toPlatform: "irc",
  toServer: "irc.wetfish.net",
  toChannel: "#botspam",
  fromModule: "echo",
  message: "Echo: foo bar",
  timestamp: Date.now()
}
ipc.server.emit( /*server connector's socket*/ socket, "TOSERVER", TOSERVER)



// *** Control Commands ***

// admin module -> core
var CORECONTROL = { // sent from admin module
  command: "LOADMODULE", // UNLOADMODULE, RELOADMODULE
  modules: ["echo", "foo"]
}
ipc.of.core.emit("CORECONTROL", FROMMODULE) // in admin module
coreControl.emit(FROMMODULE.command, FROMMODULE) // in core

// admin module -> core -> router
var ROUTERCONTROL = { // sent from admin module
  command: "ADDIGNORE",
  ignoreType: "NICK",
  server: "irc.wetfish.net",
  nick: "spammer"
}
ipc.of.core.emit("ROUTERCONTROL", ROUTERCONTROL) // in admin module
ipc.server.emit(messageRouterSocket, "ROUTERCONTROL", ROUTERCONTROL); // in core



// *** Subscribe Commands ***

// module -> core -> router
var SUBSCRIBE = {
  moduleIdent: "echo",
  type: "module", // connector, router
  commands: ["echo", "say"],
}
ipc.of.world.emit("SUBSCRIBE", SUBSCRIBE); // in module

ipc.server.on("SUBSCRIBE", function(data, socket) { // in core
    ipc.server.emit(messageRouterSocket, "SUBSCRIBE", data) // pass it through to the router
    toModule.on(moduleIdent, serverEmit, {
      socket: socket // thanks eventemitter3! no bind needed here!
    })
})

function serverEmit(data) { // in core
  ipc.server.emit(this.socket, data.event, data);
}
