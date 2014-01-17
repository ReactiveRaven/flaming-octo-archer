var patcher = function(patchMe, name) {
  var original;
  original = patchMe[name];
  return patchMe[name] = function() {
      arguments[0] = (+new Date+"").substr(8) + " " + arguments[0];
      return original.apply(patchMe, arguments);
  };
};

patcher(console, "log");
patcher(console, "error");

module.exports = console;