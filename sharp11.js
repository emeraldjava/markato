// sharp11.js - Julian Rosenblum
// This code has been self-plagiarized from http://julianrosenblum.com/sharp11
// One day I will make an easily exportable, client-side version of Sharp11
// and use that instead, but that day is not today.

// Dependencies: underscore.js

// interval.js

// Number to name map for interval
// 0 is not a valid interval number
var numberName = [null, 'Unison', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth',
  'Seventh', 'Octave', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth'];

// Quality to name map for interval
var qualityName = { 'M': 'Major', 'm': 'Minor', 'P': 'Perfect', 'dim': 'Diminished', 'aug': 'Augmented' };

// Maps quality of interval to quality of inverted interval
var invertedQualities = { 'P': 'P', 'M': 'm', 'dim': 'aug', 'm': 'M', 'aug': 'dim' };

// Number of half steps to each diatonic interval (array index)
var intervalHalfSteps = [null, 0, 2, 4, 5, 7, 9, 11];

// Half step offsets for major and perfect intervals
var perfectOffsets = { 'dim': -1, 'P': 0, 'aug': 1 };
var majorOffsets = { 'dim': -2, 'm': -1, 'M': 0, 'aug': 1 };

var isPerfect = function (n) {
  return [1, 4, 5, 8, 11, 12].indexOf(n) > -1;
};

var rejectInvalidIntervals = function (number, quality) {
  var badPerfect = isPerfect(number) && ['M', 'm'].indexOf(quality) > -1;
  var badMajor = !isPerfect(number) && quality === 'P';

  if (badPerfect || badMajor || number > 14 || number < 1) {
    throw new Error('Invalid interval: ' + quality + number);
  }
};

var handleAliases = function (quality) {
  return quality.replace(/^A$/, 'aug')
                .replace(/^d$/, 'dim')
                .replace(/^maj$/, 'M')
                .replace(/^min$/, 'm')
                .replace(/^perf$/, 'P');
};

// Parse a string and return an interval object
var parseInterval = function (interval) {
  var quality;
  var number;

  if (interval instanceof Interval) return interval;

  quality = interval.replace(/\d/g, ''); // Remove digits
  number = parseInt(interval.replace(/\D/g, ''), 10); // Remove non-digits

  if (!quality) { // No quality given, assume major or perfect
    quality = isPerfect(number) ? 'P' : 'M';
  }

  return new Interval(number, quality);
};

var Interval = function (number, quality) {
  quality = handleAliases(quality);
  rejectInvalidIntervals(number, quality);

  this.number = number;
  this.quality = quality;

  // Abbreviated interval name
  // Example: M6
  this.name = quality + number;

  // Full interval name
  // Example : Major Sixth
  this.fullName = qualityName[quality] + ' ' + numberName[number];

  this.toString = function () {
    return this.name;    
  };
};

// Return the equivalent interval in the opposite direction, e.g. m3 -> M6
Interval.prototype.invert = function () {
  var quality = invertedQualities[this.quality];
  var number;

  if (this.number === 1 || this.number === 8) number = this.number;
  else if (this.number < 8) number = 9 - this.number;
  else number = 23 - this.number;

  return new Interval(number, quality);
};

// Return number of half steps in interval
Interval.prototype.halfSteps = function () {
  var offsetMap = isPerfect(this.number) ? perfectOffsets : majorOffsets;
  var number = this.number > 7 ? this.number - 7 : this.number;

  return intervalHalfSteps[number] + offsetMap[this.quality];
};

var createInterval = function (number, quality) {
  return new Interval(number, quality);
};

// note.js

var mod = function (v,d) {var n=v%d; return n<0?(d+n):n};

var scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Map of note to number of half steps from C
var halfStepMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
  'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'F#': 6, 'Gb': 6, 'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10 };

// Half step offsets for major and perfect intervals
var perfectOffsets = { '-1': 'dim', '0': 'P', '1': 'aug' };
var majorOffsets = { '-2': 'dim', '-1': 'm', 0: 'M', '1': 'aug' };

var accidentals = ['b', 'n', '#'];

var sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
var flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

// Parse a note name and return object with letter, accidental
var parseName = function (name) {
  var octave = null;

  // Remove spaces
  name = name.replace(/[\s]/g, '');

  // Resolve 'x' and 's'
  name = name.replace('x', '##').replace('s', '#');

  // Extract octave number if given
  if (/\d$/.test(name)) {
    octave = parseInt(name.slice(-1));
    name = name.slice(0, -1);
  } 

  // Throw an error for an invalid note name
  if (!(/^[A-Ga-g](bb|##|[b#n])?$/).test(name)) {
    throw new Error('Invalid note name:  ' + name);
  }

  return {
    letter: name[0].toUpperCase(),
    acc: name.slice(1) || 'n',
    octave: octave
  };
};

// Increase the letter of a note by a given interval
var addNumber = function (note, number) {
  var letter = note.letter;
  var index = scale.indexOf(note.letter);
  var newIndex = mod(index + number - 1, scale.length);

  return scale[newIndex];
};

// Find the interval number between two notes given their letters
var distanceBet = function (letter1, letter2) {
  var index1 = scale.indexOf(letter1);
  var index2 = scale.indexOf(letter2);
  var distance = mod(index2 - index1, scale.length) + 1;

  return distance;
};

// Find the number of half steps between two notes
var halfStepsBet = function (note1, note2) {
  return mod(halfStepMap[note2] - halfStepMap[note1], 12);
};

// Find the number of half steps to the diatonic interval given inteval number
var getDiatonicHalfSteps = function (number) {
  number = mod(number - 1, scale.length);
  return halfStepMap[scale[number]];
};

// Find the number of half steps between interval and corresponding diatonic interval
var getQualityOffset = function (int) {
  var map = isPerfect(int.number) ? perfectOffsets : majorOffsets;
  var key = _.invert(map)[int.quality];

  return parseInt(key, 10);
};

// Find the offset between 
var getHalfStepOffset = function (number, halfSteps) {
  var diatonicHalfSteps = getDiatonicHalfSteps(number);
  var halfStepOffset = halfSteps - diatonicHalfSteps;

  // Handle various abnormalities
  if (halfStepOffset === 11) halfStepOffset = -1;
  if (halfStepOffset === -11) halfStepOffset = 1;

  return halfStepOffset;
};

var isNote = function (note) {
  return note instanceof Note;
};

var Note = function (name, octave) {
  name = parseName(name);

  this.letter = name.letter;
  this.acc = this.accidental = name.acc;
  this.octave = octave || name.octave;

  // Disallow octaves below 0 or above 9
  if (this.octave && this.octave < 0 || this.octave > 9) {
    throw new Error('Invalid octave number: ' + octave);
  }

  // Name does not include 'n' for natural
  this.name = this.letter + (this.acc === 'n' ? '' :  this.acc);

  this.toString = function () {
    return this.octave ? this.name + this.octave : this.name;
  };

  // Key type (# or b), null for C
  this.keyType = null;
  if (_.contains(sharpKeys, this.name)) this.keyType = '#';
  if (_.contains(flatKeys, this.name)) this.keyType =  'b';
};

var createNote = function (note, octave) {
  if (isNote(note)) return new Note(note.name, octave || note.octave);

  return new Note(note, octave);
};

// Sharp the note
Note.prototype.sharp = function () {
  var octave = this.octave;

  // Change the accidental depending on what it is
  switch (this.acc) {
    case 'b': 
      return new Note(this.letter, octave);
    // When sharping a double sharp, we need to go to the next letter
    case '##': 
      // B## requires octave increase
      if (octave && this.letter === 'B') octave += 1;

      if (this.letter === 'B' || this.letter === 'E') { // B and E are weird
        return new Note(addNumber(this, 2) + '##', octave);
      }
      else {
        return new Note(addNumber(this, 2) + '#', octave);    
      }
      break;
    case 'bb': 
      return new Note(this.letter + 'b', octave);
    default: 
      return new Note(this.name + '#', octave);
  }
};

// Flat the note
Note.prototype.flat = function () {
  var octave = this.octave;

  // Change the accidental depending on what it is
  switch (this.accidental) {
    case '#': 
      return new Note(this.letter, octave);
    // When flatting a double flat, we need to go to the previous letter
    case 'bb': 
      // Cbb requires octave decrease
      if (octave && this.letter === 'C') octave -= 1;

      if (this.letter === 'C' || this.letter === 'F') { // C and F are weird
        return new Note(addNumber(this, 7) + 'bb', octave);
      }
      else {
        return new Note(addNumber(this, 7) + 'b', octave);    
      }
      break;
    case '##': 
      return new Note(this.letter + '#', octave);
    default: 
      return new Note(this.name + 'b', octave);
  }    
};

// Shift the note by a given number of half steps
Note.prototype.shift = function (halfSteps) {
  var note = this;
  var func;
  var amount;

  func = halfSteps < 0 ? 'flat' : 'sharp';
  amount = Math.abs(halfSteps);

  _.times(amount, function () {
    note = note[func]();
  });

  return note;
};

// Get rid of double sharps, double flats, B#, E#, Cb, and Fb
Note.prototype.clean = function () {
  var octave = this.octave;
  var newName = this.name;

  // Handle octave switch for B#(#) and Cb(B)
  if (octave) {
    if (this.name.slice(0, 2) === 'B#') octave += 1;
    if (this.name.slice(0, 2) === 'Cb') octave -= 1;
  }

  newName = newName.replace('B#', 'C');
  newName = newName.replace('E#', 'F');
  newName = newName.replace('Cb', 'B');
  newName = newName.replace('Fb', 'E');

  // Note: Cases like B## are handled properly, because B## becomes C#
  if (newName.slice(1) === '##') {
    newName = addNumber(this, 2);
  }
  if (newName.slice(1) === 'bb') {
    newName = addNumber(this, 7);
  }

  return new Note(newName, octave);
};

// Return the interval to a given note object or string name
Note.prototype.getInterval = function (note) {
  var number;
  var quality;
  var halfSteps;

  // Difference in number of half steps between interval and diatonicHalfSteps
  var halfStepOffset;

  // If the note that is being raised is a double accidental, throw an error
  // It's theoretically possible but it gets messy
  if (this.accidental === 'bb' || this.accidental === '##') {
    throw new Error('Can\'t use double sharp or double flat as base key.');
  }

  note = createNote(note);

  number = distanceBet(this.letter, note.letter);
  halfSteps = halfStepsBet(this.clean().name, note.clean().name);
  halfStepOffset = getHalfStepOffset(number, halfSteps);

  if (isPerfect(number)) {
    quality = perfectOffsets[halfStepOffset];
  }
  else {
    quality = majorOffsets[halfStepOffset];
  }

  if (!quality) throw new Error('Invalid interval');

  return createInterval(number, quality);
};

Note.prototype.transpose = function (int, down) {
  // A note that is the proper number away, ignoring quality
  var note;

  // The number of half steps between the given note and that note
  var halfSteps;

  // The number of half steps between that note and the proper note
  var halfStepOffset;

  // If the note that is being raised is a double accidental, throw an error
  // It's theoretically possible but it gets messy
  if (this.accidental === 'bb' || this.accidental === '##') {
    throw new Error('Can\'t use double sharp or double flat as base key.');
  }

  int = parseInterval(int);

  // Transposing down is the same as transposing up by inverted interval
  if (down) int = int.invert();

  note = new Note(addNumber(this, int.number), this.octave);
  halfSteps = halfStepsBet(this.clean().name, note.name);

  // Find the half step offset to the diatonic interval
  halfStepOffset = - getHalfStepOffset(int.number, halfSteps);

  // Alter it to get the interval we actually want
  halfStepOffset += getQualityOffset(int);
  note = note.shift(halfStepOffset);

  // Handle octave numbers
  if (note.octave) {
    if (down) {
      if (this.lowerThan(note)) note.octave -= 1;
      if (int.number > 7) note.octave -= 1;
    }
    else {
      if (this.higherThan(note)) note.octave += 1;
      if (int.number > 7) note.octave += 1;
    }
  }

  return note;
};

// Changes sharp to flat, flat to sharp
Note.prototype.toggleAccidental = function () {
  if (this.acc === '#') {
    return this.transpose('dim2');    
  }
  else if (this.acc === 'b') {
    return this.transpose('aug7');    
  }
  else {
    return this.clean();    
  }
};

// Return true if current note is enharmonic with a given note
Note.prototype.enharmonic = function (note) {
  note = createNote(note);

  return halfStepMap[this.clean().name] === halfStepMap[note.clean().name];
};

// Returns true if note is lower (within a C-bound octave) than the given note
Note.prototype.lowerThan = function (note) {
  note = createNote(note);

  // Handle octave numbers
  if (this.octave && note.octave) {
    if (this.octave < note.octave) return true;
    if (this.octave > note.octave) return false;
  }

  if (this.enharmonic(note)) return false;

  if (this.letter === note.letter) {
    return accidentals.indexOf(this.acc) < accidentals.indexOf(note.acc);
  }

  return scale.indexOf(this.letter) < scale.indexOf(note.letter); 
};

// Returns true if note is higher (within a C-bound octave) than the given note
Note.prototype.higherThan = function (note) {
  var sameNote;

  note = createNote(note);

  sameNote = this.enharmonic(note);
  sameNote = sameNote && (!this.octave || !note.octave || this.octave === note.octave);

  return !sameNote && !this.lowerThan(note);
};

// Get the number of half steps between two notes
Note.prototype.getHalfSteps = function (note) {
  var n1;
  var n2;

  note = createNote(note);

  n1 = this.clean();
  n2 = note.clean();

  try {
    return n1.getInterval(n2).halfSteps();
  }
  catch (e1) {
    try {
      return n1.toggleAccidental().getInterval(n2).halfSteps();
    }
    catch (e2) {
      return n1.getInterval(n2.toggleAccidental()).halfSteps();
    }
  }
};

// Return true if note is in a given array of notes, matching octave numbers if applicable
Note.prototype.containedIn = function (arr) {
  return _.some(arr, function (note) {
    if (note.enharmonic(this)) {
      return !note.octave || !this.octave || note.octave === this.octave;
    }
  }, this);
};

// Return true if note is in a specified range, inclusive
Note.prototype.inRange = function (range) {
  return !this.lowerThan(range[0]) && !this.higherThan(range[1]);
};

// Return a random note between two bounds
// REMOVED so that I don't have to deal with random library dependency