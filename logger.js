var Logger = function(){
  this.errors = '';
  this.success = '';
  this.count = 0;
  this.err = 0;
  this.succ = 0;

  function logError(message) {
    this.errors += message + "\n";
    this.count++;
    this.err++;
  };

  function logSuccess(message) {
    this.success += message + "\n";
    this.count++;
    this.succ++;
  }

  function reset() {
    this.errors = '';
    this.success = '';
    this.count = 0;
    this.err = 0;
    this.succ = 0;
  }

  function createLogFile() {
    let text = "----------Logfile----------\nTotal " + this.count + ", Errors " +
               this.err + ", Success " + this.succ + "\n\n" +
               "----------Errors----------\n" + this.errors + "\n" +
               "----------Messages----------\n" + this.success + "\n";
    return text;
  }

  return{
    logError: logError,
    logSuccess: logSuccess,
    reset: reset,
    createLogFile: createLogFile
  }

}();
