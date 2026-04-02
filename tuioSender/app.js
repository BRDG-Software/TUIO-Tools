//========== TUIO var =================================
const osc = require('node-osc');
const client = new osc.Client('127.0.0.1', 3333)

let touches = new Array();
let touchIndexCounter = 0;
let touchCount = 1
let intervalMin = 1
let intervalMax = 1000

let touchX = 0.0; 
let touchY = 0.0;
let touchVelocity = 0.0;
let touchAcceleration = 0.0;

function getRandomRange(_min, _max){
  return Math.random()*(_max - _min)+ _min;
}

// start with an initial amount of touches
for (let i = 0; i < touchCount; i++) {
  // iterator serves as sessionId for each touch
  let random = getRandomRange(intervalMin, intervalMax);
  //console.log("Creating Touch with lifespan of " + random);

  let touch = new Touch(i, random );
  touches.push(touch);
  touchIndexCounter ++;
};

let fSeq = 0; //used to set a unique frame id to conclude each message chunk
//=========== TUIO var =================================

const express = require('express');
const app = express();
const port = 3000;
let xNorm = 0.0;
let yNom = 0.0;

let aliveMessage = function() {
  aliveTouches = new Array();
  let aliveMsg = new osc.Message('/tuio/2Dcur');
  aliveMsg.append({ type: 's', value: 'alive' });
  
  for (touch of touches){
    if ( touch.isAlive() ){
      aliveMsg.append({ type: 'i', value: touch.getSessionId() });
      aliveTouches.push( touch.getSessionId() );
    }
  }

  client.send(aliveMsg, function(err){
    if (err) console.log(err);
    console.log(aliveTouches);
  });  
}

// 2 -----> send the updated set message for each touch (position, etc)
let setMessage = function() {
  for (let i = 0; i < touches.length; i++) {
    touches[i].update();
    touches[i].sendMessage();
  };
  
}

let frameSequenceMessage = function() {
  let fseqMsg =  new osc.Message('/tuio/2Dcur')
  fseqMsg.append({ type: 's', value: 'fseq' });
  fseqMsg.append({ type: 'i', value: fSeq }); //frame sequence as int32
  client.send(fseqMsg, function(err){
    if (err) console.log(err);
  });
  fSeq ++; // frame sequence must be incremented each call so its unique
}


let sendMessage = function(x,y) {
  console.log(`sending TUIO message X=${x}, Y= ${y}`)
  touchX = x; touchY = y;
  aliveMessage();
  setMessage();
  frameSequenceMessage();

  cleanupTouches();
}

let cleanupTouches = function(){
  let deadTouches = new Array();

  //loop through all touches, get index of dead touches
  for (let i=0; i<touches.length; i++){
    if ( !touches[i].isAlive() ){
      deadTouches.push(i);
    }
  }

  //now loop through deadTouches, removing items from touches array
  for (let i =0; i<deadTouches.length; i++){
    touches.splice(deadTouches[i], 1);

    console.log("Adding New Touch with ID: " + touchIndexCounter);
    let touch = new Touch(touchIndexCounter, getRandomRange(intervalMin, intervalMax) );
    touches.push(touch);
    touchIndexCounter ++;
  } 
}

// =====================================================
// ================== Touch Class ======================
// =====================================================

function Touch(_sessionId, _lifespan){
  this.location = {"x": touchX, "y": touchY };
  this.velocity = {"x": touchVelocity, "y": touchVelocity};
  this.acceleration = touchAcceleration; 
  this.sessionId    = _sessionId;
  this.fSeq       = _sessionId;
  this.lifeSpan   = _lifespan;
  this.lifeCounter  = 0;
  this.alive      = true;
};

Touch.prototype.update = function(){
  this.location.x = touchX;
  this.location.y = touchY;

  if(this.lifeCounter < this.lifeSpan) this.lifeCounter ++;
  else this.alive = false;

};

Touch.prototype.sendMessage = function(){
  if (this.alive){

    var setMsg =  new osc.Message('/tuio/2Dcur')
    setMsg.append({ type: 's', value: 'set' });
    setMsg.append({ type: 'i', value: this.sessionId }); //sessionId as int32
    setMsg.append({ type: 'f', value: this.location.x }); //x_pos as float
    setMsg.append({ type: 'f', value: this.location.y }); //y_pos as float
    setMsg.append({ type: 'f', value: this.velocity.x }); //x_vel as float
    setMsg.append({ type: 'f', value: this.velocity.y }); //y_vel as float
    setMsg.append({ type: 'f', value: this.acceleration }); //acceleration as float
    client.send(setMsg, function(err){
      if (err) console.log(err);
       console.log(setMsg);
    });
    
  }
};

Touch.prototype.getSessionId = function(){
  return this.sessionId;
}

Touch.prototype.isAlive = function(){
  if (this.alive) return true;
  else return false;
}

// method to cleanup touches on program exit  
process.on('SIGINT', function() {
  console.log('TEST');
  reset();
  process.exit();
});
// ========= END Touch Class =============================



app.use(express.json());

app.use(express.static('public')); 

// Endpoint to receive the click data
app.post('/api/mouse-click', (req, res) => {
  const { x, y } = req.body;
  console.log(`Received click coordinates: X=${x}, Y=${y}`);
  sendMessage(x,y)
  res.status(200).send('Coordinates received by the server!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


