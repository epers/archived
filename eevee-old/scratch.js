'use strict';

global.test = function(inVal) {
  console.log(inVal);
};

global['test']('3 is the value');
