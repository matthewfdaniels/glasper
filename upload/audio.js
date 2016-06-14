var source;
var lastSource;
var scratch;
var bufferArray;
var vizData;
var duration;

var fileArray = ["audio/keys_loop.wav","audio/vocal.wav"];

function playMusic(){

  // var playNow2 = createSource(scratch);
  // source2 = playNow2.source;

  // if (!source2.start){
  //   source2.start = source.noteOn;
  // }
  // source2.start(0);

  // var delayTime = 100;
  // playing = true;

  var currTime = context.currentTime;
  var startTime = currTime + 1;
  var playLength = 30000;
  loadSounds(fileArray, playLength, startTime, "now");
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


function loadSounds(url,playingLength,startingTime,thing){
  var bufferLoader = new BufferLoader(context,url,finishedLoading,playingLength,startingTime,thing);
  bufferLoader.load();
}

function finishedLoading(bufferList,playingLength,startingTime,thing) {
  bufferArray = bufferList;

  sampler.selectAll("div")
    .data(bufferArray)
    .enter()
    .append("div")
    .attr("class","sample-item")
    .style("background-color",function(d,i){
      if(i==0){
        return "red"
      }
      if(i==1){
        return "green"
      }
    })
    .each(function(d){
      var currTime = context.currentTime;

      var playNow = createSource(d);
      source = playNow.source;
      source.loop = true;
      var gainNode = playNow.gainNode;
      var duration = "30000"/1000 + 2;

      // gainNode.gain.linearRampToValueAtTime(1, currTime);
      // gainNode.gain.linearRampToValueAtTime(1, currTime + 2);

      if (!source.start){
        source.start = source.noteOn;
      }

      source.start(context.currentTime + (startingTime - context.currentTime));
      // gainNode.gain.linearRampToValueAtTime(1, startingTime + duration-2);
      // gainNode.gain.linearRampToValueAtTime(0, startingTime + duration);

      d3.select(this).on("click",function(d,i){
        if(gainNode.gain.value==0){
          d3.select(this).style("opacity",1);
          gainNode.gain.setValueAtTime(1, context.currentTime);
        }
        else if(gainNode.gain.value==1){
          d3.select(this).style("opacity",.5);
          gainNode.gain.setValueAtTime(0, context.currentTime);
        }
        ;

        // gainNode.gain.linearRampToValueAtTime(1,context.currentTime);
        // gainNode.gain.linearRampToValueAtTime(0, context.currentTime+1);

        // console.log(gainNode.gain.linearRampToValueAtTime(0,context.currentTime));
      })
    })
    ;

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

    gainNode.gain.linearRampToValueAtTime(1, startingTime);
    gainNode.gain.linearRampToValueAtTime(1, startingTime + 2);

    if (!source.start){
      source.start = source.noteOn;
    }

    source.start(context.currentTime + (startingTime - context.currentTime));
    gainNode.gain.linearRampToValueAtTime(1, startingTime + duration-2);
    gainNode.gain.linearRampToValueAtTime(0, startingTime + duration);
}

playMusic();
// loadScratch("https://p.scdn.co/mp3-preview/b868c11bc56b76f19b4db1f199e43e0e7c13c90d");
//
// d3.select("body").on("click",function(){
//
//   d3.select(".marker")
//     .style("left","0px")
//     .transition()
//     .duration(10000)
//     .ease("linear")
//     .style("left","600px")
//     ;
//
//   // playHelper(bufferArray[1],"30000",context.currentTime,"now");
//   playHelper(bufferArray[0],"30000",context.currentTime,"now");
//
//   //
//   // var playNow2 = createSource(bufferArray[0]);
//   // source2 = playNow2.source;
//   //
//   // if (!source2.start){
//   //   source2.start = source.noteOn;
//   // }
//   // source2.start(0);
//
//   // var playNow2 = createSource(scratch);
//   // source2 = playNow2.source;
//   //
//   // if (!source2.start){
//   //   source2.start = source.noteOn;
//   // }
//   // source2.start(0);
// })
// ;

var noteArray = [];

var sampler = d3.select(".sampler");

// d3.json("viz/keys_01_60hz.json", function(error, data) {
//
//     data = [16,69,141,337,529,784,835,913,1106,1297];
//
//     function midiAdjust(time){
//       return time*(60000 / (88 * 96));
//     }
//
//     var noteArray = [];
//
//     for (note in data){
//       noteArray.push(midiAdjust(data[note]));
//     }
//
//     // noteArray = noteArray.sort(function(b,a) {
//     //   var o1 = +a.startTime;
//     //   var o2 = +b.startTime;
//     //
//     //   if (o1 > o2) return -1;
//     //   if (o1 < o2) return 1;
//     //   return 0;
//     // });
//     //
//     // var startTimeMin = d3.min(noteArray,function(d){return d.startTime});
//     // var startTimeMax = d3.max(noteArray,function(d){return d.startTime});
//     // duration = startTimeMax - startTimeMin;
//     var width = 600;
//     var leftScale = d3.scale.linear().domain([0,10000]).range([0,width]);
//     //
//     d3.select("body")
//       .append("div")
//       .selectAll("div")
//       .data(noteArray)
//       .enter()
//       .append("div")
//       .attr("class","circle")
//       .style("left",function(d){
//         return leftScale(d)+"px"
//       })
//       ;
//     //
//     d3.select("body")
//       .append("div")
//       .attr("class","marker")
//       ;
//
//
//
//
//
//
//
// });
