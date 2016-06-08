
function playMusic(){

  clearInterval(sampleRotate);
  d3.select(".number-one-date-wrapper").style("opacity",1);

  var playNow2 = createSource(scratch);
  source2 = playNow2.source;

  if (!source2.start){
    source2.start = source.noteOn;
  }
  source2.start(0);

  var delayTime = 100;
  playing = true;

  tickDelay = setTimeout(function(){

    if(muted == false){

      for (i=2; i<20; i++){
        var timeOne = d3.time.day.offset(dates[dates.length-1], 7);
        var timeTwo = d3.time.day.offset(dates[dates.length-1], 7*i);
        if(nestedDatesTwo[unParse(timeOne)]["track"] != nestedDatesTwo[unParse(timeTwo)]["track"]){
          playLength = Math.max((i-1) * shiftDuration,shiftDuration);
          break;
        }
      }

      var currTime = context.currentTime;
    //
      var currSong;
      var previewItemId = nestedDatesTwo[unParse(d3.time.day.offset(dates[dates.length-1], 7))]["preview"];
      currSong = "https://p.scdn.co/mp3-preview/" + previewItemId
      if(previewItemId == "manual"){
        var hostUrl = document.location.origin;
        var pathUrl = document.location.pathname.replace("index.html","");
        var idSong = nestedDatesTwo[unParse(d3.time.day.offset(dates[dates.length-1], 7))]["track"];
        currSong = hostUrl+pathUrl+"url/"+idSong + ".m4a"
      }
      startTime = currTime + 1;
      loadSounds(currSong, playLength, startTime, "now");
  //
    }
    transition = d3.select({}).transition()
        .duration(shiftDuration)
        .ease("linear");

    tick();

  }, delayTime);

}


function BufferLoader(context, urlList, callback, playingLength, startingTime, thing) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
  this.startingTime = startingTime;
  this.playingLength = playingLength;
  this.thing = thing;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList, loader.playingLength, loader.startingTime, loader.thing);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

function loadScratch(url) {
  var req = new XMLHttpRequest();
  req.open("GET",url,true);
  req.responseType = "arraybuffer";
  req.onload = function() {
      //decode the loaded data
      context.decodeAudioData(req.response, function(buffer) {
          scratch = buffer;
      });
  };
  req.send();
}

function loadHit(url) {
  var req = new XMLHttpRequest();
  req.open("GET",url,true);
  req.responseType = "arraybuffer";
  req.onload = function() {
      //decode the loaded data
      context.decodeAudioData(req.response, function(buffer) {
          hit = buffer;
      });
  };
  req.send();
}

function play() {
    //create a source node from the buffer
    var src = context.createBufferSource();
    src.buffer = buf;
    //connect to the final output node (the speakers)
    src.connect(context.destination);
    //play immediately
    src.noteOn(0);
}

window.AudioContext = window.AudioContext || window.webkitAudioContext;
context = new AudioContext();
loadScratch("url/i_wish.mp3");
// loadHit("url/scratch.wav");

function loadSounds(url,playingLength,startingTime,thing){
  if(url == "https://p.scdn.co/mp3-preview/NULL"){
    console.log("null song");
  }
  else{
    var bufferLoader = new BufferLoader(
      context,
      [
        url
      ],
      finishedLoading,playingLength,startingTime,thing
      );

    bufferLoader.load();
  }

}

function finishedLoading(bufferList,playingLength,startingTime,thing) {
  playHelper(bufferList[0],playingLength,startingTime,thing);
};

function createSource(buffer) {
  var source = context.createBufferSource();
  var gainNode = context.createGain ? context.createGain() : context.createGainNode();
  source.buffer = buffer;
  // Connect source to gain.
  source.connect(gainNode);
  // Connect gain to destination.
  gainNode.connect(context.destination);

  return {
    source: source,
    gainNode: gainNode
  };
}

function playHelper(bufferNow,playingLength,startingTime,thing) {

    var currTime = context.currentTime;

    lastSource = source;

    var playNow = createSource(bufferNow);
    source = playNow.source;
    source.loop = true;
    var gainNode = playNow.gainNode;
    var duration = playingLength/1000 + 2;

    gainNode.gain.linearRampToValueAtTime(0, startingTime);
    gainNode.gain.linearRampToValueAtTime(1, startingTime + 2);

    if (!source.start){
      source.start = source.noteOn;
    }

    source.start(context.currentTime + (startingTime - context.currentTime));

    gainNode.gain.linearRampToValueAtTime(1, startingTime + duration-2);
    gainNode.gain.linearRampToValueAtTime(0, startingTime + duration);

}
