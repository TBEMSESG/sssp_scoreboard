var serviceId = "BUfYCvzcdV.SampleBGService";
var serviceLaunched = false;
var test, homeScore, guestScore, period, timeClock;
var temp;

function launchService() {
  // Launch Service
  tizen.application.launchAppControl(
    new tizen.ApplicationControl(
      "http://tizen.org/appcontrol/operation/pick",
      null,
      "image/jpeg",
      null,
      [new tizen.ApplicationControlData("caller", ["ForegroundApp", ""])]
    ),
    serviceId,
    function () {
      console.log("launchService " + serviceId + " success");
    },
    function (e) {
      console.log("launchService " + serviceId + " failed: " + e.message);
    }
  );
}

function isEmpty(value) {
  return value == null || value.length === 0;
}

var messageManager = (function () {
  var messagePortName = "BG_SERVICE_COMMUNICATION";
  var remoteMsgPort;
  var localMsgPort;
  var watchId;

  function init() {
      console.log("messageManager.init");
      localMsgPort = tizen.messageport.requestLocalMessagePort(messagePortName);
      watchId = localMsgPort.addMessagePortListener(onMessageReceived);

  }

  function connectToRemote() {
      console.log("messageManager.connectToRemote");
      remoteMsgPort = tizen.messageport.requestRemoteMessagePort(
        serviceId,
        messagePortName
      );
      // messageManager.runHTTPServer(); // Starting HTTP server
  }

  function sendTest(msg) {
      console.log("messageManager.sendTest");
      var messageData = {
        key: "test",
        value: msg,
      };
      remoteMsgPort.sendMessage([messageData]);
  }


  function terminate() {
    var messageData = {
      key: "terminate",
      value: "now",
    };
    remoteMsgPort.sendMessage([messageData]);
  }

  function onMessageReceived(data) {
    console.log("[onMessageReceived] data: " + JSON.stringify(data));
    test.innerHTML += JSON.stringify(data) + "<br/>";
    
    if (data[0].key === "data") {
    
    var timingData = JSON.parse(data[0].value)
// console.log(timingData)
// console.log(JSON.stringify(timingData))
    homeScore.innerHTML = timingData.scoreHome
    guestScore.innerHTML = timingData.scoreGuest
    period.innerHTML = timingData.period
    timeClock.innerHTML = timingData.time
  }
    
    if (data[0].value === "started") {
      setTimeout(connectToRemote, 0); //due to performance tuning on Tz7.0 and the CPU priority change, function has to be invoked async
      serviceLaunched = true;
    }

    if (data[0].value === "terminated") {
      localMsgPort.removeMessagePortListener(watchId);
      serviceLaunched = false;
    }
  }

  return {
    init: init,
    terminate: terminate,
    sendTest: sendTest,
    // runHTTPServer: runHTTPServer,
  };
})();


//Initialize function
var init = function () {
    // TODO:: Do your initialization job
    console.log('init() called');

    test = document.getElementById("test");
    homeScore = document.getElementById('homeScore')
    guestScore = document.getElementById('guestScore')
    period = document.getElementById('period')
    timeClock = document.getElementById('timeClock')


    timeClock.innerHTML = "waiting for update..."

    // document.addEventListener('visibilitychange', function() {
        // if(document.hidden){
        //     // Something you want to do when hide or exit.
        // } else {
        //     // Something you want to do when resume.
        // }
    // });
 
    // add eventListener for keydown
    document.addEventListener('keydown', function(e) {
    	switch(e.keyCode){
    	case 37: //LEFT arrow
    		break;
    	case 38: //UP arrow
    		break;
    	case 39: //RIGHT arrow
    		break;
    	case 40: //DOWN arrow
    		break;
    	case 13: //OK button
            console.log("Pressed OK-...")
    		break;
    	case 10009: //RETURN button
		tizen.application.getCurrentApplication().exit();
    		break;
    	default:
    		console.log('Key code : ' + e.keyCode);
    		break;
    	}
    });

    messageManager.init();
    launchService();
    //setTimeout(function() {}, 5000);
  };
// window.onload can work without <body onload="">
window.onload = init;