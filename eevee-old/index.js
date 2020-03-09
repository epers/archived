'use strict';

const fs = require('fs');
const fork = require('child_process').fork;
const init = fork(`${process.cwd()}/modules/init.js`);
