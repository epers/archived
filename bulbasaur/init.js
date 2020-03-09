const fork = require('child_process').fork

console.log(`Starting Porygon`);

// fork off the core process
const core = fork('./core.js');

core.on('error', function (err) {
    if (code == 0) {
        console.log(`Could not load core, ${err}`);
    }
});

core.on('exit', function (code) {
    if (code == 0) {
        console.log(`Core exited with exit code ${code}`);
    }
});