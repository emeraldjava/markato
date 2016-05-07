var S, _, addSection, interpretLyricChordLine, interpretLyricSection, isChordLine, markatoObjectFromState, parseFooterLine, parseFooterStartLine, parseLine, parseLyricChordLine, parseMetaLine, parseSectionLine;

_ = require('underscore');

S = require('string');

isChordLine = function(line) {
  return S(line).startsWith(':');
};

parseFooterStartLine = function(state, line) {
  state.current.footer = true;
  return state;
};

parseMetaLine = function(state, line) {
  var metaName, metaValue, prefix;
  prefix = line.split(' ')[0];
  metaName = prefix.slice(2);
  metaValue = S(line).chompLeft(prefix).trim().s;
  state.meta[metaName] = metaValue;
  return state;
};

parseFooterLine = function(state, line) {
  var alts, chord, parts;
  parts = S(line).strip(' ').split('=>');
  if (parts.length === 2) {
    chord = parts[0];
    alts = parts[1].split(',');
    state.alts[chord] = alts;
  }
  return state;
};

addSection = function(state, sectionName) {
  var firstTime, lyrics;
  firstTime = !_.contains(state.sections, sectionName);
  state.sections.push(sectionName);
  lyrics = {
    section: sectionName,
    firstTime: firstTime,
    lines: []
  };
  state.lyrics.push(lyrics);
  if (firstTime) {
    state.chords[sectionName] = [];
  }
  state.current.lastLine = null;
  return state;
};

parseSectionLine = function(state, line) {
  return addSection(state, S(line.slice(1)).trim().s);
};

parseLyricChordLine = function(state, line) {
  var lastLine;
  lastLine = state.current.lastLine;
  if (!state.sections.length) {
    state = addSection(state, "UNTITLED");
  }
  if (isChordLine(line)) {
    _.last(state.lyrics).lines.push({
      chords: S(line.slice(1)).trim().s.split(' '),
      lyrics: ''
    });
  } else {
    if (lastLine && !lastLine.lyrics) {
      lastLine.lyrics = line;
    } else {
      _.last(state.lyrics).lines.push({
        chords: [],
        lyrics: line
      });
    }
  }
  state.current.lastLine = _.last(_.last(state.lyrics).lines);
  return state;
};

parseLine = function(state, line) {
  line = S(line).trim().collapseWhitespace().s;
  if (!line) {
    return state;
  }
  if (S(line).startsWith('###')) {
    return parseFooterStartLine(state, line);
  }
  if (S(line).startsWith('##')) {
    return parseMetaLine(state, line);
  }
  if (S(line).startsWith('#')) {
    return parseSectionLine(state, line);
  }
  if (state.current.footer) {
    return parseFooterLine(state, line);
  }
  return parseLyricChordLine(state, line);
};

interpretLyricChordLine = function(state, section, lineObj, lineNum) {
  var addPhrase, caretSplit, chordIndex, chords, exceptionIndices, lyrics, phrases, sectionChords, sectionName;
  sectionName = section.section;
  lyrics = lineObj.lyrics, chords = lineObj.chords;
  phrases = [];
  addPhrase = function(obj) {
    return phrases.push(_.defaults(obj, {
      string: '',
      chord: '',
      exception: false,
      wordExtension: false
    }));
  };
  if (section.firstTime) {
    state.chords[sectionName].push(chords);
  }
  sectionChords = state.chords[sectionName][lineNum];
  caretSplit = lyrics.split('^');
  chordIndex = 0;
  exceptionIndices = [];
  if (!chords.length) {
    chords = sectionChords;
  } else {
    chords = _.map(chords, function(chord, index) {
      if (chord === '*') {
        return sectionChords[index];
      } else {
        exceptionIndices.push(index);
        return chord;
      }
    });
  }
  if (!lyrics) {
    _.each(chords, function(chord, index) {
      return addPhrase({
        chord: chord,
        exception: _.contains(exceptionIndices, index)
      });
    });
  } else {
    _.each(caretSplit, function(phrase, index) {
      var chord, lastPhrase;
      if (index === 0) {
        if (phrase) {
          addPhrase({
            string: caretSplit[0]
          });
        }
        return;
      }
      lastPhrase = caretSplit[index - 1];
      chord = chords[chordIndex];
      if ((phrase != null) && phrase[0] === ' ') {
        addPhrase({
          chord: chord,
          exception: _.contains(exceptionIndices, chordIndex)
        });
        addPhrase({
          string: S(phrase).trim().s
        });
      } else {
        addPhrase({
          string: S(phrase).trim().s,
          chord: chord,
          exception: _.contains(exceptionIndices, chordIndex)
        });
      }
      if (phrase && lastPhrase && phrase[0] !== ' ' && S(lastPhrase).right(1).s !== ' ') {
        _.last(phrases).wordExtension = true;
      }
      return chordIndex += 1;
    });
  }
  return phrases;
};

interpretLyricSection = function(state, section) {
  section.lines = _.map(section.lines, _.partial(interpretLyricChordLine, state, section));
  if (!section.lines.length) {
    section.lines = _.findWhere(state.lyrics, {
      section: section.section
    }).lines.concat();
    section.lines = _.map(section.lines, function(line) {
      return _.map(line, function(phrase) {
        return _.extend(_.clone(phrase), {
          exception: false
        });
      });
    });
  }
  return section;
};

markatoObjectFromState = function(state) {
  return _.omit(state, 'current');
};

module.exports = {
  parseString: function(str) {
    var lines, parseState;
    lines = S(str).lines();
    parseState = {
      current: {
        footer: false,
        lastLine: null
      },
      meta: {},
      alts: {},
      sections: [],
      chords: {},
      lyrics: []
    };
    parseState = _.reduce(lines, parseLine, parseState);
    parseState.lyrics = _.map(parseState.lyrics, _.partial(interpretLyricSection, parseState));
    return markatoObjectFromState(parseState);
  }
};
