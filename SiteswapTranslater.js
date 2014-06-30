/** Siteswap object creation function
 * @param pattern - the pattern object that this siteswap will be used by
 * @param source - the source hand of the swap
 * @param swapIndex - the index into the array of swaps in the pattern
 * Siteswap properties are;
 * source - the hand that the prop is passed from
 * destination - the hand the prop is passed to
 * swap - the siteswap of the pass
 * isPass - is this a pass to another juggler or a self
 */

function Siteswap(pattern, source, swapIndex) {
  this.source = source;
  this.destination = (source + pattern.swaps[swapIndex]) % pattern.numHands;
  this.swap = pattern.swaps[swapIndex] / pattern.numJugglers;
  this.isPass = (this.source % pattern.numJugglers) != (this.destination % pattern.numJugglers)
}

/** default string conversion for a siteswap
 * this returns a string containing the swap value and if this is a pass
 * a letter representing the destination hand. Hands are lettered from 'a'
 * to the letter representing the number of hands
 */

Siteswap.prototype.toString = function () {
  var str = this.swap.toString();
  if(this.isPass) {
    str += String.fromCharCode(('a').charCodeAt(0) + this.destination);
  }
  return str;
}

/** Pattern object creation function
 * @param the number of jugglers in the pattern
 * @param a string of the numbers in this siteswap
 * Pattern properties are;
 * numJugglers - the number of jugglers in the pattern
 * numHands - the number of hands in the pattern (2 per juggler is assumed)
 * swaps - an array containing the siteswap values
 * numProps - the number of props used in the pattern
 * siteswaps - an array of Siteswap objects that represent the local tosses for the pattern
 */

function Pattern(numberOfJugglers, siteswapStr) {
  if(numberOfJugglers < 1){
    throw "There must at least 1 juggler in the pattern";
  }
  this.numJugglers = numberOfJugglers; 
  this.numHands = 2 * this.numJugglers;
  this.setSwaps(siteswapStr);
  this.numProps = this.calculateNumberOfProps();
  this.calculateSiteswaps();
      
}

/**  returns a string of the current swaps
 */

Pattern.prototype.toString = function() {
  if(this.swaps.length > 0) {
    var retStr = "[ ";
    var curSwap = 0;
    while(curSwap < this.swaps.length) {
      retStr += this.swaps[curSwap];
      ++curSwap;
      if(curSwap < this.swaps.length) {
        retStr += " ,";
      }
    }
    retStr += "]";
  }
  else {
    retStr = "There is currently no swaps set";
  }
  return retStr;
}

/** Parses a string of siteswap digits and sets the swap list from it
 * @param siteswapStr - is a string containing the digits of the siteswap
 */

Pattern.prototype.setSwaps = function (siteswapStr) {
  if(siteswapStr == undefined || siteswapStr === "") {
    throw "Invalid parameter passed to setSwaps";
  }
  this.swaps = new Array(siteswapStr.length);
  for(i = 0 ; i < siteswapStr.length ; ++i) {
    this.swaps[i] = parseInt(siteswapStr[i], 10);
    if(Number.NaN === this.swaps[i]) {
      this.swaps[i] = ((siteswapStr[i].toUpper()).charCodeAt(0) - ('A').charCodeAt(0)) + 10;
      if(Number.NaN === this.swaps[i]) {
        throw "Invalid character used in siteswap string"
      }
    }
  }
}

/** Calculate the number of props in pattern from the siteswap
 * @return the number of objects in the pattern
 * the return value must be a whole integer value for this to be a valid siteswap
 */

Pattern.prototype.calculateNumberOfProps = function () {
  if(0 === this.swaps.length) {
    throw "Unable to calculate the number of objects siteswap is invalid";
  }
  var total = 0;
  var average = 0;
  for(var i = 0 ; i < this.swaps.length ; ++i) {
    total += this.swaps[i];
  }
  average = total / this.swaps.length;
  return average;
}

/** Validate the currently set siteswap 
 * @return boolean - true if the it is a valid siteswap, else false
 */

Pattern.prototype.validateSiteswap = function() {
  // the modulo 1 of an integer is 0
  return (this.calculateNumberOfObjects() % 1) === 0;
}


/** Creates the array of Siteswaps from the swaps list and stores it in 
 * the siteswaps property
 */

Pattern.prototype.calculateSiteswaps = function() {

  var numSites = this.swaps.length * this.numHands;
  var curSwap = 0;
  var curHand = 0;
  this.siteswaps = new Array(numSites);

  for(i = 0 ; i < numSites ; ++i) {
    this.siteswaps[i] = new Siteswap(this, curHand, curSwap);
    ++curHand;
    curHand %= this.numHands;
    ++curSwap;
    curSwap %= this.swaps.length;
  }
}

/** Creates a string of the local siteswap formatted for display in an HTML file
*/

Pattern.prototype.toLocalSiteswapHTMLString = function() {
  var str = "&lt ";
  var juggler = 0;
  while(juggler < this.numJugglers) {
    for(var i = juggler ; i < this.siteswaps.length ; i += this.numJugglers) {
      str += this.siteswaps[i].toString() + " ";
    }
    ++juggler;
    if(juggler < this.numJugglers) {
      str += "| ";
    }
  }
  str += "&gt";
  return str;
}

