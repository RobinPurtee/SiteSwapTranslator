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
  this.isPass = (this.source % pattern.numJugglers) != (this.destination % pattern.numJugglers);
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
 * swaps - an array containing the siteswap values (a.k.a. global siteswap values)
 * numProps - the number of props used in the pattern
 * siteswaps - an array of Siteswap objects that represent the local tosses for the pattern (a.k.a Prechac notation)
 */

function Pattern(numberOfJugglers, siteswapStr) {
  if(numberOfJugglers < 2){
    throw "There must be at least 2 jugglers in the pattern";
  }
  this.numJugglers = numberOfJugglers; 
  this.numHands = 2 * this.numJugglers;
  this.setSwaps(siteswapStr);
  this.numProps = this.calculateNumberOfProps();
  // normal hand order is right-right-left-left
  this.invertHandOrder = false;
  this.calculateSiteswaps();
  // In the following lines it may seem inefficient to recalculate the siteswaps every time
  // however given what it would take to reshuffle the values it is pretty much the same.
  // this insures that the pattern starts with a pass
  var numSwaps = this.swaps.length;
  while(!this.siteswaps[0].isPass) {
    this.rollLeft();
    --numSwaps;
    if(0 >= numSwaps) {
      throw "Invalid siteswap; No passes will be made."
    }
  }
  // this ensures that the pass is straight
  if(this.isDiagonal(this.siteswaps[0])) {
    // if the first pass is diagonal, inverting the hand order to right-left-left-right will swap
    // the juggler's roles.
    this.invertHandOrder = true;
    this.calculateSiteswaps();
  }

}

/**  returns a string of the current swaps
 */

Pattern.prototype.toString = function() {
  var retStr = '';
  if(this.swaps.length > 0) {
    for(var curSwap = 0 ; curSwap < this.swaps.length ; ++curSwap) {
      retStr += this.swaps[curSwap].toString();
    }
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
    if(isNaN(this.swaps[i])) {
      var char = siteswapStr[i].toUpperCase();
      this.swaps[i] = ((char).charCodeAt(0) - ('A').charCodeAt(0)) + 10;
      if(isNaN(this.swaps[i])) {
        throw "Invalid character used in siteswap string";
      }
    }
  }
  this.validateSiteswap();
}

/** Calculate the number of props in pattern from the siteswapcalculateNumberOfProps
 * @return the number of objects in the pattern
 * the return value must be a whole integer value for this to be a valid siteswap
 */

Pattern.prototype.calculateNumberOfProps = function () {
  if(0 === this.swaps.length) {
    throw "Unable to calculate the number of objects siteswap is empty";
  }

  var total = 0;
  var average = 0;
  for(var i = 0 ; i < this.swaps.length ; ++i) {
    total += this.swaps[i];
  }
  average = total / this.swaps.length;
  return average;
}

/** Validate the currently set global siteswap 
 * @return boolean - true if the it is a valid siteswap, else false
 */

Pattern.prototype.validateSiteswap = function () {
  	var catch_position,
	catches = [],
	period = this.swaps.length;
	for (var i = 0; i < period; ++i) {
		catch_position = (i + this.swaps[i]) % period;
		if (catches[catch_position])
			throw "Invalid siteswap entered: a throw at height "+this.swaps[i]+" at position "+(i+1)+" will land at the same time as a previous throw";
		catches[catch_position] = true;
	}
	return true;
}

/** Creates the array of Siteswaps from the swaps list and stores it in 
 * the siteswaps property
 */

Pattern.prototype.calculateSiteswaps = function() {
  this.validateSiteswap();
  var numSites = LCM([this.swaps.length , this.numHands]);//this.numJugglers;
  // var numSites = this.swaps.length * this.numHands;//this.numJugglers;
 var curSwap = 0;
  var curHand = 0;
  this.siteswaps = [];// new Array(numSites);

  for(i = 0 ; i < numSites ; ++i) {
    this.siteswaps[i] = new Siteswap(this, curHand, curSwap);
    ++curHand;
    curHand %= this.numHands;
    ++curSwap;
    curSwap %= this.swaps.length;
  }
}

/** Shift the swaps by one to right
 * this can be used to help normalize the pattern to make the first toss a 
 * pass from juggler A's right hand
 */

Pattern.prototype.rollRight = function () {
  this.validateSiteswap();
  var swap = this.swaps.pop();
  this.swaps.unshift(swap);
  this.calculateSiteswaps();
}

/** Shift the swaps by one to left
 * this can be used to help normalize the pattern to make the first toss a 
 * pass from juggler A's right hand
 */

Pattern.prototype.rollLeft = function () {
  this.validateSiteswap();
  var swap = this.swaps.shift();
  this.swaps.push(swap);
  this.calculateSiteswaps();
}

/** test if the given siteswap is a diagonal pass
 * @param the siteswap to test if it is a diagonal pass
 * @return true if the given siteswap is a pass else false
 */

Pattern.prototype.isDiagonal = function (siteswap) {
  var bRet = siteswap.isPass;
  if(bRet) {
    if(this.invertHandOrder) {
      // using a hand order of right-left-left-right
      // if the source and destination are on oppose sides of the number juggler 
      bRet = (siteswap.source < this.numJugglers && siteswap.destination >= this.numJugglers) ||
             (siteswap.source >= this.numJugglers && siteswap.destination < this.numJugglers);
    }
    else {
      // using a hand order of right-right-left-left
      // if both the source and destination are on either side of that line then this must be a diagonal pass
      bRet = (siteswap.source < this.numJugglers && siteswap.destination < this.numJugglers) ||
             (siteswap.source >= this.numJugglers && siteswap.destination >= this.numJugglers);
    }
  }
  return bRet;
}

/** create a string for a siteswap in a JoePass format
 * @param the siteswap to create the string for
 * @return the string that represents the siteswap
 */

Pattern.prototype.siteswapToJoePassString = function (siteswap) {
  var str = siteswap.swap.toString();
  if(siteswap.isPass) {
    str += 'p';
    if(this.isDiagonal(siteswap)){
      str += 'x';
    }
    if(this.numJugglers > 2) {
      // if there are more than 2 jugglers there needs to be a destination juggler
      str += ':';
      str += (siteswap.destination % this.numJugglers) + 1;
    }
  }
  return str;
}

/** Creates a JoePass compatible string of the local siteswap formatted for 
 *  display in an HTML file
 */

Pattern.prototype.toJoePassString = function() {
  var str = "&lt ";
  var juggler = 0;
  var numberOfSiteswaps = LCM([this.swaps.length , this.numJugglers]);
  while(juggler < this.numJugglers) {
    for(var i = juggler ; i < numberOfSiteswaps ; i += this.numJugglers) {
      str += this.siteswapToJoePassString(this.siteswaps[i]) + " ";
    }
    ++juggler;
    if(juggler < this.numJugglers) {
      str += "| ";
    }
  }
  str += "&gt";
  return str;
}

/** Create a text description of the given siteswap
 * @param the siteswap to create the description of
 * @return a string containing the description
 */
Pattern.prototype.siteswapToDescription = function (siteswap) {

  var str = "self ";
  if(siteswap.isPass) {
    if(this.isDiagonal(siteswap)) {
      str = "diagonal ";
    }
    else {
      str = "straight ";
    }
  }
  if(siteswap.swap === 0) {
    str = "empty Hand";
  }
  else if(siteswap.swap === 1) {
    str = "zip";
  }
  else if(siteswap.swap === 2) {
    str = "hold";
  }
  else if(siteswap.isPass && siteswap.swap < 3) {
    str += "zap";
  }
  else if(siteswap.swap === 3) {
  }
  else if(siteswap.isPass && siteswap.swap < 4) {
    str += "pass";
  }
  else if(siteswap.swap === 4) {
    str = "double hef";
  }
  else if(siteswap.swap <= 5) {
    str += "double";
  }
  else if(siteswap.swap <= 8) {
    str += "triple";
  }
  else {
    str += "quad (or higher)";
  }
  return str;
}

/** Create a long hand text description of the pattern
 */

Pattern.prototype.toDescription = function () {
  var str = "";
  var juggler = 0;
  while(juggler < this.numJugglers) {
    str += "Juggler " + String.fromCharCode(('A').charCodeAt(0) + juggler) + "<br/>"
    for(var i = juggler ; i < this.siteswaps.length ; i += this.numJugglers) {
      str += this.siteswapToDescription(this.siteswaps[i]) + "<br/> ";
    }
    ++juggler;
    if(juggler < this.numJugglers) {
      str += "<br/>";
    }
  }
  return str;
}

/* calculate the lowest common multiple
*/

function LCM(A)  // A is an integer array (e.g. [-50,25,-45,-18,90,447])
{   
    var n = A.length, a = Math.abs(A[0]);
    for (var i = 1; i < n; i++)
     { var b = Math.abs(A[i]), c = a;
       // find the greatest common divisor of a and b
	while (a && b)
       {	if( a > b)
		{ a = a%b ;}
		else
		{ b = b%a; } 
	}
	// calculate the lowest common multiple
	// 0==b or 0==a, so gcm = a+b
       a = Math.abs(c*A[i])/(a+b);
     }
    return a;
}
