// handle loading config here
// takes the module name as a paramater
// sees if that module has a config file
// and then compares it to global
// and then returns a object of it all, with module config overriding/supplmeneting core config
module.exports = {
  loadConfig: function(moduleIdent) {
    var globalConfig = null;
    var moduleConfig = null;
    var config = null;
    try {
      // load up the global config
      globalConfig = require(`${process.cwd()}/config/totodile.config.js`);
    } catch (err) {
      // if we can't read core config, die.
      throw new Error(`Could not read core config at ${process.cwd()}/config/totodile.config.js !!!`);
    }
    try {
      // then load up the module config
      moduleConfig = require(`${process.cwd()}/config/${moduleIdent}.config.js`);
    } catch (err) {
      // if there is no module config, just return the core config
      return globalConfig;
    }
    if(moduleConfig) {
      config = Object.assign(globalConfig, moduleConfig); // let module config override global config
    } else {
      config = globalConfig;
    }
    config.initModules = globalConfig.initModules; // don't let a module redefine what the init module list is
    config.commandPrefix = globalConfig.commandPrefix; // don't let a module reassign the command prefix
    return config;
  }
}
