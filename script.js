//Too many places where odScore is being changed... I should fix that


var clock = {
  startTime: new Date(),
  clockRunning: false,
  prevTime: "00:00:00",
  curTime: "00:00:00",
  startC: document.getElementById("start"),
  stopC: document.getElementById("stop"),
  bonusPoints: 0,
  curPoints: 0,
  multiplier: 1, //only applies to time
  bonuses: {
    mulStart: [new Date(0), 30]
    //0 is start time
    //1 is cooldown in minutes
  },
  bonusValid: function(name) {
    let b = this.bonuses[name];
    return new Date().getTime() - b[0].getTime() <= b[1] * 60000;
  }
};

var backDrop = document.createElement("style");
document.head.appendChild(backDrop);
//Maybe put these in clock

let odScore = 0;
let toggle = new Audio(
  "https://cdn.glitch.com/e8442d5b-59f9-4b50-94d1-ea6471451e43%2FToggle.mp3?v=1601933702846"
);
function full() {
  try{
      let targetelement = document.body;

    targetelement.webkitRequestFullscreen();

  }catch(e){
    document.getElementById("text").innerHTML=e;
  }
}
function run() {
  if (
    typeof window.orientation !== "undefined" ||
    navigator.userAgent.indexOf("IEMobile") !== -1
  ) {
    document.getElementById("score").style.fontSize = "100px";
    document.getElementById("timer").style.fontSize = "30px";
    document.getElementById("timer").style.bottom = "-25px";
    let tabs = document.getElementsByClassName("tabs");
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].style.fontSize = "10px";
    }
  }

  clock.startC.onclick = startClock;
  clock.stopC.onclick = stopClock;
  clock.stopC.style.display = "none";
  toggle.crossOrigin = "anonymous";

  let add = document.getElementsByClassName("button-add");
  for (let i = 0; i < add.length; i++) {
    add[i].onclick = event => {
      quickAdd(event);
    };
  }
  
  document.getElementById("clock-multiplier").onclick = ()=>{
    let button = document.getElementById("clock-multiplier");
    if(!button.style.background||button.style.background=="transparent"){
      clock.multiplier = 1.25;
      button.style.background = "#00800054";
    }else{
      clock.multiplier = 1;
      button.style.background = "transparent";
    }
  }
  
  openTab("", "clock");
}

function updateUI() {
  document.getElementById("score").innerHTML = odScore;
  if (clock.clockRunning) {
    document.getElementById("timer").innerHTML = clock.curTime;
  } else {
    document.getElementById("timer").innerHTML = "00:00:00";
  }
  if (clock.bonusValid("mulStart")) {
    changeBackDropColor("#8bff8b75");
  } else {
    changeBackDropColor("white");
  }
}
 
async function quickAdd(event) {
  //console.log(event);

  odScore += parseInt(event.path[0].innerHTML.replace("+", ""));
  
  addPointsHour(new Date(), event.path[0].innerHTML.replace("+", ""));
}
function changeBackDropColor(color) {
  try {
    backDrop.sheet.deleteRule(0);
  } catch (ignored) {}
  backDrop.sheet.insertRule(
    ":fullscreen::backdrop {background-color: " + color + "; }"
  );
  document.getElementsByTagName("BODY")[0].style.background = color;
  //if not in fullscreen
}
function updateClock() {
  let dif = parseInt((Date.now() - clock.startTime.getTime()) / 1000);

  let sec = "00" + (dif % 60);
  dif = parseInt(dif / 60);
  let min = "00" + (dif % 60);
  dif = "00" + parseInt(dif / 60);

  clock.curTime = dif.slice(-2) + ":" + min.slice(-2) + ":" + sec.slice(-2);
  if (clock.curTime != clock.prevTime) {
    clock.prevTime = clock.curTime;
    updateUI();
  }
  if(rand(60)==0){
    if (clock.curTime.split(":")[1] != clock.prevTime.split(":")[1]) {
      let tempBonuses = 0;
      if (rand(40) == 0) {
        clock.bonuses.mulStart[0] = new Date();
        setTimeout(updateClock(), clock.bonuses.mulStart[1] * 60001);
        //to clear this
      }
      if (rand(20) == 0) {
        tempBonuses += rand(2) + 1;
      }
      if (rand(100) == 0) {
        tempBonuses += 10;
      }
      if (rand(1000) == 0) {
        tempBonuses += 100;
      }
      if (clock.bonusValid("mulStart")) {
        tempBonuses *= 2;
      }
      odScore += tempBonuses;
      clock.bonusPoints += tempBonuses;
      addPointsHour(new Date(), tempBonuses);
      clock.curPoints++;
    }
  }
}

function rand(n) {
  return parseInt(Math.random() * n);
}
function stopClock() {
  //maybe change this to just points accrued because it's being kept track of anyways.
  odScore += parseInt((Date.now() - clock.startTime.getTime()) / 60000*clock.multiplier);
  console.log(
    parseInt((Date.now() - clock.startTime.getTime()) / 60000),
    clock.curPoints
  );

  console.log("earned " + clock.bonusPoints);
  clock.curPoints = 0;
  clock.bonusPoints = 0;

  document.getElementById("timer").innerHTML = "00:00:00";
  toggle.currentTime = 0;
  clock.stopC.style.display = "none";
  clock.startC.style.display = "block";
  document.getElementById("timer").style.opacity = 0;
  clock.prevTime = "00:00:00";

  updateUI();
  clock.curTime = "00:00:00";
  clock.clockRunning = false;
  //TODO also this


  addPointsRange(clock.startTime, new Date(),clock.multiplier);

  toggle.play();
}

async function startClock() {
  toggle.currentTime = 0;
  // document.body.webkitRequestFullscreen();
  toggle.play();
  document.getElementById("timer").style.opacity = 1;
  clock.stopC.style.display = "block";
  clock.startC.style.display = "none";
  clock.startTime = new Date();
  clock.clockRunning = true;
  while (clock.clockRunning) {
    updateClock();
    await sleep(30);
  }
}
function openTab(e, id) {
  let tabs = document.getElementsByClassName("bottom-tabs");
  console.log(tabs);
  for (let i = 0; i < tabs.length; i++) {
    let el = tabs[i];
    if (el.id == id) {
      document.getElementById(el.id + "-tab").style.background = "#95cdff";
      el.style.display = "flex";
    } else {
      document.getElementById(el.id + "-tab").style.background = "aliceblue";
      el.style.display = "none";
    }
  }
}
function sleep(s) {
  return new Promise(function(res) {
    setTimeout(res, s);
  });
}
