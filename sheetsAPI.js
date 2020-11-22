var CLIENT_ID =
  "164464708237-fj7tk5kmh6n4j3u7ftdlc388e1ncuvsl.apps.googleusercontent.com";
var API_KEY = "AIzaSyBGUwADu-R4K5g8Y_OAbufZ8MCBC2_EawI";
var DISCOVERY_DOCS = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4"
];
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";
var SPREADSHEET_ID = "1xmWtwttaSUZ5vvCAfj3IzLvoVWK6mMzqfPcGjLdx6NU";
var authorizeButton = document.getElementById("authorize_button");
var signoutButton = document.getElementById("signout_button");
var debug = true;
let spreadsheet = {
  hourToRow: [],
  dayToColumn: []
}; 

function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}
function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    })
    .then(
      function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
      },
      function (error) {
        document.getElementById("loading-screen").innerHTML = error.details;
        document.getElementById("content").style.display = "none";
      }
    );
}
function spam() {
  for (let i = 0; i < 100; i++) {
    getCell(generateRangeWithDate(new Date(), false));
  }
}

async function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    document.getElementById("content").style.display = "block";
    document.getElementById("loading-screen").style.display = "none";
    await generateTimeArrays();


    let total = await getCell(generateRangeWithDate(new Date(), true));
    document.getElementById("score").innerHTML = total.result.values[0][0];
    odScore = parseInt(total.result.values[0][0]);
    //kickoff

    authorizeButton.style.display = "none";
    signoutButton.style.display = "block";
  } else {
    document.getElementById("content").style.display = "none";
    document.getElementById("loading-screen").style.display = "block";

    authorizeButton.style.display = "block";
    signoutButton.style.display = "none";
  }
}
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn();
}
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}
function getMilValue(date) {
  return (
    60000 * date.getMinutes() +
    1000 * date.getSeconds() +
    date.getMilliseconds()
  );
}
function addPointsRange(start, end) {
  if (start.getHours() == end.getHours() && start.getDate() == end.getDate()) {
    addPointsHour(
      start,
      parseInt((getMilValue(end) - getMilValue(start)) / 60000)
    );
  } else {
    let secondsResidue = 0;
    let millisecondsResidue = 0;
    while (true) {
      if (end.getMinutes() == 0) {
        end.setHours(end.getHours() - 1);
        if (
          start.getHours() == end.getHours() &&
          start.getDate() == end.getDate()
        ) {
          let timeMil = 3600000 - getMilValue(start);
          timeMil += 1000 * secondsResidue + millisecondsResidue;
          timeMil = parseInt(timeMil / 60000);
          addPointsHour(end, timeMil);
          break;
        } else {
          addPointsHour(end, 60);
        }
      } else {
        secondsResidue = end.getSeconds();
        millisecondsResidue = end.getMilliseconds();

        addPointsHour(end, end.getMinutes());
        end.setMinutes(0);
      }
    }
  }
}
async function addPointsHour(date, points) {
  return new Promise(async r => {
    updateUI();
    console.log("adding " + points * clock.multiplier + " points with x" + clock.multiplier + " multiplier.");
    //return;
    $("button").prop("disabled", true);

    points *= clock.multiplier;
    let range = generateRangeWithDate(date, false);
    let response = await getCell(range);
    let result = response.result;
    if (result.values) {
      result.values[0][0] = parseInt(result.values[0][0]) + parseInt(points);
    } else {
      result.values = [[points]];
    }

    let body = {
      values: result.values
    };
    await updateCell(range, body);
    $("button").prop("disabled", false);
    r();
  });
}
function generateRangeWithDate(date, total) {
  let sign = "AM";
  let hour = date.getHours();
  if (hour >= 12) {
    sign = "PM";
    hour %= 12;
  }
  if (hour == 0) {
    hour = 12;
  }
  let row = spreadsheet.hourToRow[hour + ":00 " + sign];
  let column =
    spreadsheet.dayToColumn[date.getMonth() + 1 + "/" + date.getDate()];
  if (total) {
    return ["Eric!" + column + 3];
  } else {
    return ["Eric!" + column + row];
  }
}

function getCell(range) {
  return new Promise(re => {
    gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: SPREADSHEET_ID,
        range: range
      })
      .then(r => {
        re(r);
      })
      .catch(e => {
        displayError(e);

        setTimeout(async () => {
          console.log("retrying getting a cell");
          let r = await getCell(range);
          hideError();
          re(r);
        }, 10000);
      });
  });
}
function updateCell(range, body) {
  return new Promise(r => {
    gapi.client.sheets.spreadsheets.values
      .update({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: "USER_ENTERED",
        resource: body
      })
      .then(() => {
        r();

        //console.log(`${result.updatedCells} cells updated.`);
      })
      .catch(e => {
        setTimeout(async () => {
          await updateCell(range, body);
          r();
        }, 10000);
      });
  });
}

function generateTimeArrays() {
  return new Promise(function (re) {
    let ranges = ["Eric!A2:ZZZ2", "Eric!C1:C27"];
    gapi.client.sheets.spreadsheets.values
      .batchGet({
        spreadsheetId: SPREADSHEET_ID,
        ranges: ranges
      })
      .then(response => {
        var result = response.result.valueRanges;
        result[0].values[0].forEach((el, i) => {
          if (el.includes("/")) {
            let l = "";
            let ic = i;
            while (ic > 0) {
              if (parseInt(ic / 26) == 0 && ic != i) {
                ic--;
              }
              let char = String.fromCharCode(65 + (ic % 26));
              l = char + l;
              ic = parseInt(ic / 26);
            }
            spreadsheet.dayToColumn[el] = l;
          }
        });

        for (let i = 0; i < result[1].values.length; i++) {
          let el = result[1].values[i][0];
          if (el && (el.includes("AM") || el.includes("PM"))) {
            spreadsheet.hourToRow[el] = i + 1;
          }
        }
        re();
      })
      .catch(e => {
        //maybe make this into a function
        displayError(e);
        setTimeout(async () => {
          await generateTimeArrays();
          hideError();
          re();
        }, 10000);
      });
  });
}

async function displayError(e) {
  let startDate = new Date();
  while (new Date().getTime() - startDate.getTime() <= 10000) {
    document.getElementById("error").style.display = "flex";
    let seconds = 10 - parseInt((new Date().getTime() - startDate.getTime()) / 1000);
    if (e.result.error.status == undefined) {
      document.getElementById("error").innerHTML = "Not connected to the internet. \nRetrying in " + seconds + " second(s)";
    } else {
      document.getElementById("error").innerHTML =
        e.result.error.status +
        "\n\n retrying in " + seconds +
        " second(s)...";
    }

    await sleep(50);
  }
}
function sleep(s) {
  return new Promise(function (res) {
    setTimeout(res(), s);
  });
}
function hideError() {
  document.getElementById("error").style.display = "none";
}
