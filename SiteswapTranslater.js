/** Siteswap object creation function
 * @param pattern - the pattern object that this siteswap will be used by
 * @param sourceHand - the hand that throws the swap
 * @param swapIndex - the index into the array of swaps in the pattern
 * Siteswap properties are;
 * sourceHand - the hand that the prop is passed from (identifies the juggler as well)(juggler = sourceHand % 2)
 * destinationHand - the hand that the prop is passed to (identifies the juggler as well)(juggler = destinationHand % 2)
 * swap - the siteswap of the pass, in fractional notation (a.k.a. Prechac notation)
 * isPass - is this a pass to another juggler or a self
 * isDiagonal - true if the throw is R-R or Left-Left
 */

function Siteswap(pattern, sourceHand, swapIndex) {
  this.sourceHand = sourceHand; 
  this.destinationHand = (sourceHand + pattern.swaps[swapIndex]) % pattern.numHands;
  this.swap = pattern.swaps[swapIndex] / pattern.numJugglers;
  // this.isPass = (this.source % pattern.numJugglers) != (this.destinationHand % pattern.numJugglers);
  this.isPass = (0 != pattern.swaps[swapIndex] % pattern.numJugglers); // if 0, sourceHand = destinationHand
  this.isDiagonal = (pattern.hands[this.sourceHand] == pattern.hands[this.destinationHand] ); // pattern.hands has values "right" or "left"
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
  // define the names of the hands
  this.handsEnum = [  "R", "L" ];

  if(numberOfJugglers < 2){
    throw "There must be at least 2 jugglers in the pattern";
  }
  this.numJugglers = numberOfJugglers; 
  this.numHands = this.handsEnum.length * this.numJugglers;
  this.setEvenHands();
  this.setSwaps(siteswapStr);
  this.numProps = this.calculateNumberOfProps();
  // normal hand order is right-right-left-left
  this.invertHandOrder = false;
  this.calculateSiteswaps();
  // In the following lines it may seem inefficient to recalculate the siteswaps every time
  // however given what it would take to reshuffle the values it is pretty much the same.
  // this insures that the pattern starts with a pass
  // 	this.shiftToFirstPass(); (this is now a separate button)
 
  // ONLY IF THERE ARE 2 JUGGLERS: this ensures that the pass is straight, 
  if(this.isDiagonal(this.siteswaps[0])) {
    // if the first pass is diagonal, inverting the hand order to right-left-left-right will swap
    // the juggler's roles.

    this.invertHandOrder = true;
    this.calculateSiteswaps();
  }

}
Pattern.prototype.setSymmetricHands = function() 
{
	if (0==this.numJugglers%this.handsEnum.length)
	{	// even
		this.setEvenHands();
	}
	else
	{	// odd
		this.setOddHands();
	}

}
/** set hands for an odd number of jugglers:
    R L R L R L
    (crossing/uncrossing is the same for all jugglers)
 */
Pattern.prototype.setOddHands = function() 
{	  this.hands = [];
	index = 0;
	for (var juggler = 0; juggler < this.numJugglers; juggler++)
	{
		for (hand in this.handsEnum)
		{	this.hands[index] =this.handsEnum[hand];
			index++;
		}
	}
	this.handsSetForJoePass = false; // Joepass requires that the first juggler has no have "x" pass (to my regret...)
}

/** set hands for an even number of jugglers:
    R R R R L L L L
    (not all jugglers can cross/uncross in the same situations)
 */
Pattern.prototype.setEvenHands = function() 
{	this.hands = [];
	index = 0;
	for (hand in this.handsEnum)
	{
		for (var juggler = 0; juggler < this.numJugglers; juggler++)
		{	this.hands[index] =this.handsEnum[hand];
			index++;
		}
	}
	this.handsSetForJoePass = true;// Joepass requires that the first juggler has no have "x" pass (to my regret...)
}

Pattern.prototype.toString = function() {
  var retStr = '';
  if(this.swaps.length > 0) {
    for(var curSwap = 0 ; curSwap < this.swaps.length ; ++curSwap) {
	if (this.swaps[curSwap]<10)
      	{	retStr += this.swaps[curSwap].toString();
	}
	else // convert 10 to a, 11 to b, etc.
	{
		retStr += String.fromCharCode(this.swaps[curSwap]-10 + ('a').charCodeAt(0));
	}
    }
  }
  else {
    retStr = "There is currently no site-swap set";
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
      var char = siteswapStr[i].toLowerCase();
      this.swaps[i] = ((char).charCodeAt(0) - ('a').charCodeAt(0)) + 10;
      if(isNaN(this.swaps[i])) {
        throw "Invalid character used in siteswap string";
      }
    }
  }
  this.validateSiteswap();
}

/** shift the global site-swap to the left until the first throw is a pass
 * NOTE: this only works if Pattern.calculateSiteswaps(); has been performed !
 */

Pattern.prototype.shiftToFirstPass = function () {
  var numSwaps = this.swaps.length;
  while(!this.siteswaps[0].isPass) {
    this.rollLeft();
    --numSwaps;
    if(0 >= numSwaps) {
      throw "No passes will be made."
    }
  }

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
  var numSites = LCM([this.swaps.length , this.numHands]);//numHands must be used in stead of numJugglers in case the individual site-swap has odd length
  // var numSites = this.swaps.length * this.numHands;
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
 * @return true if the given siteswap is a pass from R to R or L to L 
 */

Pattern.prototype.isDiagonal = function (siteswap) {
 return siteswap.isDiagonal;
}

/** test if the given siteswap is should have an 'x' appended to the pass,
  when used as input for Joepass
 */

Pattern.prototype.requiresCrossSign = function (siteswap) {
 var integerPart = Math.floor( Math.round(siteswap.swap * 100) / 100); // 
 if( siteswap.isDiagonal )
	return (0!=integerPart%this.handsEnum.length);
 else
	return (0==integerPart%this.handsEnum.length);
}

/** create a string for a siteswap in a JoePass format
 * @param the siteswap to create the string for
 * @return the string that represents the siteswap

 */

Pattern.prototype.siteswapToJoePassString = function (siteswap) {
  var str = (Math.round(siteswap.swap*100)/100).toString();
  if(siteswap.isPass) 
  {
    str += 'r' + Math.round(this.numJugglers* (siteswap.swap % 1)) ;// %1 takes the fractional part
    if(this.requiresCrossSign(siteswap))
    {
      str += 'x';
    }
  }
  return str;
}
/** create a string for a siteswap in a JoePass format
 * @param the siteswap to create the string for
 * @return the string that represents the siteswap

 */

Pattern.prototype.siteswapToPrechacString = function (siteswap) 
{
  var str = (Math.round(siteswap.swap*100)/100).toString();
  if(siteswap.isPass) 
  {
    str += 'p';
    if(this.requiresCrossSign(siteswap))
    {
      str += 'x';
    }
    if(this.numJugglers > 2) 
    {
      // if there are more than 2 jugglers there needs to be a destination juggler
      str += ':';
      str += String.fromCharCode(('A').charCodeAt(0)+ siteswap.destinationHand % this.numJugglers);
	// (siteswap.destinationHand % this.numJugglers) + 1;
    }
  }
  return str;
}

/** Creates a header for the joePass string, for example:
#sx ! use extensions to vanilla siteswap
#d 2 0.5 ! Juggler B throws 0.5 beats later than Juggler A
#D - ! Disable the correction of the pass value by the amount of the delay 
 */

Pattern.prototype.headerForJoePassString = function() 
{
	var newline = '<br>\n' ;// for HTML display. for a textfile, this should be '\n';this may have to be \r\n on Windows
	var result = '#sx ! use extensions to vanilla siteswap '+newline; 
	result += '#objectCount  '+this.numProps+newline; 

	for (var juggler = 2; juggler <= this.numJugglers ; juggler++)
	{	var delay = Math.round(100 * (juggler-1) / this.numJugglers)/100;
		result += '#jugglerDelay '+juggler+' '+delay+' ! Juggler '+ String.fromCharCode(('A').charCodeAt(0) + juggler-1) +' throws '+delay+' beats later than Juggler A  '+newline; 
	}
	result += '#D - ! Disable the correction of the pass value by the amount of the delay  '+newline;  // delays are included in the pass values
	return result;
}

/** Creates a JoePass compatible string of the local siteswap formatted for 
 *  display in an HTML file
 */

Pattern.prototype.toJoePassString = function() 
{
  var str = this.headerForJoePassString();
  for (var count = 0; count < this.siteswaps.length/this.numJugglers ; count++)
  {
    str += "&lt; "+this.siteswapToJoePassString(this.siteswaps[count*this.numJugglers]) ;
    for(var j = 1 + count*this.numJugglers ; j < (count+1) * this.numJugglers; j++) 
    {
      str += "  | "+this.siteswapToJoePassString(this.siteswaps[j]) ;
    }
	str+= "&gt; <br>";
  }
  return str;
}


/** Creates a JoePass compatible string of the local siteswap formatted for 
 *  display in an HTML file
 */

Pattern.prototype.toPrechacString = function() {
  var str = "&lt; ";
  var juggler = 0;
  var numberOfSiteswaps = LCM([this.swaps.length , this.numJugglers]);
  while(juggler < this.numJugglers) {
    for(var i = juggler ; i < numberOfSiteswaps ; i += this.numJugglers) {
      // str += this.siteswapToPrechacString(this.siteswaps[i]) + " ";
      str += Math.round(100*this.siteswaps[i].swap)/100 + " ";
    }
    ++juggler;
    if(juggler < this.numJugglers) {
      str += "| ";
    }
  }
  str += "&gt; ";
  return str;
}

/** Create a text description of the given siteswap
 * @param the siteswap to create the description of
 * @return a string containing the description
 */
Pattern.prototype.siteswapToDescription = function (siteswap) {

  var str = (Math.round(siteswap.swap*100)/100).toString() + ' = ';
  if(!siteswap.isPass) 
  {   str += " self ";

  }
  else
  {
    if(this.isDiagonal(siteswap)) {
      str += " diagonal ";
    }
    else {
      str += " straight ";
    }
  }
  if(siteswap.swap === 0) {
    str += "empty Hand";
  }
  else if(siteswap.swap === 1) {
    str += "zip";
  }
  else if(siteswap.swap === 2) {
    str += "hold";
  }
  else if(siteswap.isPass && siteswap.swap < 3) {
    str += "zap";
  }
  else if(siteswap.swap === 3) {
    str += "single";
  }
  else if(siteswap.isPass && siteswap.swap < 4) {
    str += "pass";
  }
  else if(siteswap.swap === 4) {
    str += "double hef";
  }
  else if(siteswap.swap <= 5) {
    str += "double or triple";
  }
  else if(siteswap.swap <= 8) {
    str += "triple or quad";
  }
  else {
    str += "quad (or higher)";
  }
  str += ' '+this.hands[siteswap.sourceHand]+' --> '+this.hands[siteswap.destinationHand];
  if(siteswap.isPass) 
  {  str += ' (to juggler '+String.fromCharCode(('A').charCodeAt(0)+ siteswap.destinationHand % this.numJugglers)+')';
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
