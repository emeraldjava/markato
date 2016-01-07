// Generated by CoffeeScript 1.10.0
(function() {
  var byline, determineKey, generateHTML, generateToken, lastDefinedChord, lastInferredChord, title,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  window.draw = function(location, song, state) {
    var canvas;
    canvas = $(location);
    state.originalKey = determineKey(song);
    state.drawKey = state.requestedKey != null ? state.requestedKey : state.originalKey;
    $('#currentKey').html(state.drawKey);
    $('#originalKey').html(state.originalKey);
    $("#transposeToolbar button").removeClass('btn-info');
    $("[data-transposeChord=" + state.drawKey + "]").addClass('btn-info');
    canvas.html(generateHTML(song, state));
    return null;
  };

  generateHTML = function(song, state) {
    var cstring, i, j, k, len, len1, len2, line, ref, ref1, section, token;
    cstring = '';
    cstring += "<h2>" + (title(song)) + "</h2>";
    cstring += "<h4>" + (byline(song)) + "</h4>";
    ref = song.lyrics;
    for (i = 0, len = ref.length; i < len; i++) {
      section = ref[i];
      if (state.showSections) {
        cstring += "<div class='section-header'>" + section.section + "</div>";
        cstring += "<hr/>";
      }
      cstring += "<div class='section'>";
      ref1 = section.lines;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        line = ref1[j];
        for (k = 0, len2 = line.length; k < len2; k++) {
          token = line[k];
          cstring += generateToken(token, state);
        }
        cstring += "<br/>";
      }
      cstring += "</div><br/>";
    }
    return cstring;
  };

  generateToken = function(token, state) {
    var chord, chord_classes, phrase_classes, result, string;
    chord = token.chord == null ? ' ' : token.chord;
    chord = chord.replace(/'/g, '');
    string = token.string === '' ? ' ' : token.string.trim();
    phrase_classes = ['phrase'];
    if (token.wordExtension) {
      phrase_classes.push('join');
    }
    chord_classes = ['chord'];
    if (state.smartMode && !token.exception) {
      chord_classes.push('mute');
    }
    if (state.drawKey !== state.originalKey && chord !== '') {
      chord = transpose(state.originalKey, state.drawKey, chord);
    }
    chord = chord.replace('#', '&#x266F;').replace('b', '&#x266D;');
    if (!state.showLyrics && chord === '') {
      return '';
    }
    if (string === ' ' && !state.showChords) {
      return '';
    }
    result = '';
    result += "<p class='" + (phrase_classes.join(' ')) + "'>";
    if (state.showChords) {
      result += "<span class='" + (chord_classes.join(' ')) + "'>" + chord + "</span><br/>";
    }
    if ((string != null) && state.showLyrics) {
      result += "<span class='string'>" + string + "</span>";
    }
    result += "</p>";
    return result;
  };

  determineKey = function(song) {
    var key, validKeys;
    validKeys = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    if (song.meta.KEY != null) {
      key = song.meta.KEY;
    }
    if (indexOf.call(validKeys, key) < 0) {
      key = createNote(lastInferredChord(song)).clean().name;
    }
    if (indexOf.call(validKeys, key) < 0) {
      key = createNote(lastDefinedChord(song)).clean().name;
    }
    if (indexOf.call(validKeys, key) < 0) {
      key = 'C';
    }
    return key;
  };

  lastInferredChord = function(song) {
    var lastLine, lastLines, lastPhrase;
    lastLines = song.lyrics[song.lyrics.length - 1].lines;
    lastLine = lastLines[lastLines.length - 1];
    lastPhrase = lastLine[lastLine.length - 1];
    return lastPhrase.chord;
  };

  lastDefinedChord = function(song) {
    var lastChord, lastLine, lastSection, lastSectionTitle;
    lastSectionTitle = song.sections[song.sections.length - 1];
    lastSection = song.chords[lastSectionTitle];
    lastLine = lastSection[lastSection.length - 1];
    lastChord = lastLine[lastLine.length - 1];
    return lastChord;
  };

  title = function(song) {
    if (song.meta.TITLE != null) {
      return song.meta.TITLE;
    } else {
      return '?';
    }
  };

  byline = function(song) {
    if ((song.meta.ARTIST != null) && (song.meta.ALBUM != null)) {
      return song.meta.ARTIST + " — " + song.meta.ALBUM;
    } else if (song.meta.ARTIST != null) {
      return song.meta.ARTIST + " — ?";
    } else if (song.meta.ALBUM != null) {
      return "? — " + song.meta.ALBUM;
    } else {
      return "? — ?";
    }
  };

}).call(this);
