var serviceId = "BUfYCvzcdV.SampleBGService";
var serviceLaunched = false;
var test, homeScore, guestScore, period, timeClock;
var temp;
var logCount = 0
var device = {
  ipAddress: "unknown...",
  modelCode: "unknown...",
  firmwareVersion: "unknown...",
  listenerPort: "unknown... (try default: 4001)",
  appVersion: "unknown"
}
var deviceInfo


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

    // console.log("[onMessageReceived] data: " + JSON.stringify(data));
    
    if (logCount >= 40) {
      logCount = 0
      test.innerHTML = ""
    }
    test.innerHTML += JSON.stringify(data) + "<br/>";
    logCount++

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

    if (data[0].key === "deviceInfo") {
      device.listenerPort = data[0].value 
      deviceInfo.innerHTML += `<br/>Application Version: <b>${device.appVersion.appInfo.version}</b><br/><br/>Device IP: <b>${device.ipAddress}</b> // Listening on PORT: <b>${device.listenerPort}</b> <br/>Device Model Code: <b>${device.modelCode}</b> running Firmware Version: <b>${device.firmwareVersion}</b><br/><br/>Press <b>INFO</b> to toggle this Window`

    
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
    deviceInfo = document.querySelector('.deviceInfo')

    timeClock.innerHTML = "..."

    // document.addEventListener('visibilitychange', function() {
        // if(document.hidden){
        //     // Something you want to do when hide or exit.
        // } else {
        //     // Something you want to do when resume.
        // }
    // });

    tizen.tvinputdevice.registerKey('Info')
    
    // add eventListener for keydown
    document.addEventListener('keydown', function(e) {
    	switch(e.keyCode){
    	case 37: //LEFT arrow
      console.log('Key code : ' + e.keyCode);
    		break;
    	case 38: //UP arrow
      console.log('Key code : ' + e.keyCode);
    		break;
      case 457: //INFO Button
      console.log('Key code (INFO): ' + e.keyCode);
      deviceInfo.classList.toggle('hidden')
        break;
    	case 39: //RIGHT arrow
      console.log('Key code : ' + e.keyCode);
    		break;
    	case 40: //DOWN arrow
      console.log('Key code : ' + e.keyCode);
    		break;
    	case 13: //OK button
      console.log("Pressed OK-...")
      console.log('Key code : ' + e.keyCode);
    		break;
    	case 10009: //RETURN button
	      	  tizen.application.getCurrentApplication().exit();
    		break;
    	default:
            // test.innerHTML += 'Key code : ' + e.keyCode + '<br/>' 	
            console.log('Key code : ' + e.keyCode);
    		break;
    	}
    });

    try {
      device.ipAddress = webapis.network.getIp();
      device.firmwareVersion = webapis.productinfo.getFirmware()
      device.modelCode = webapis.productinfo.getRealModel();
      device.appVersion = tizen.application.getCurrentApplication()
      // deviceInfo.innerHTML = `Device IP: <b>${device.ipAddress}</b> // Listening on PORT: <b>${device.listenerPort}</b> // Device Model Code: <b>${device.modelCode}</b> running Firmware Version: <b>${device.firmwareVersion}</b>. Press <b>INFO</b> to hide this window.`
 
    } catch (e) {
      console.log("getIp exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    
    
    
    messageManager.init();
    launchService();
    //setTimeout(function() {}, 5000);
  };
// window.onload can work without <body onload="">
window.onload = init;