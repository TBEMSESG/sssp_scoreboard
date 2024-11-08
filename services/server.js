// the following part manages the message Services for Tizen
var messageManager = (function () {

  var localMsgPort;
  var remoteMsgPort;
  var listenerId;

  function init () {
      var messagePortName = 'BG_SERVICE_COMMUNICATION';
      var calleeAppId = 'BUfYCvzcdV.BodetApp';

      remoteMsgPort = tizen.messageport.requestRemoteMessagePort(
          calleeAppId,
          messagePortName
      );

      localMsgPort = tizen.messageport.requestLocalMessagePort(messagePortName);
      listenerId = localMsgPort.addMessagePortListener(onMessageReceived);

      sendCommand("started");
  }

  function sendCommand (msg) {
      var messageData = { key: 'Command', value: msg };
      remoteMsgPort.sendMessage([messageData]);
  }

  function sendMessage (msg, key) {
      var messageData = { key: key || 'broadcast', value: msg };
      remoteMsgPort.sendMessage([messageData]);
  }

  function close () {
      localMsgPort.removeMessagePortListener(listenerId);
  }

  function onMessageReceived(data) {
      sendMessage('BG service receive data: ' + JSON.stringify(data));

      if (data[0].value === "startTCP") {
        // setTimeout(tcpServer.startServer, 0);  // Async invoke
        sendMessage('received startTCP');
      }
  }

  return {
      init: init,
      sendMessage: sendMessage,
      sendCommand: sendCommand
  };
})();

// Define the tcpServer globally or within messageManager to avoid scoping issues
var tcpServer = (function () {
  const PORT = 4000;

  function calculateLRC(data) {
      let lrc = 0;
      for (let i = 1; i < data.length - 2; i++) {
          lrc ^= data[i];
      }
      lrc &= 0x7F;
      if (lrc < 0x20) {
          lrc += 0x20;
      }
      return lrc;
  }

  function parseMessage (data) {
      if (data[0] !== 0x01 || data[data.length - 2] !== 0x03) {
          throw new Error('Invalid message format');
      }

      const message = data.slice(4, data.length - 2);
      const calculatedLRC = calculateLRC(data);
      const receivedLRC = data[data.length - 1];
      if (calculatedLRC !== receivedLRC) {
          throw new Error('LRC mismatch. Message may be corrupted');
      }

      return {
          time: `${String.fromCharCode(message[4])}${String.fromCharCode(message[5])}:${String.fromCharCode(message[6])}${String.fromCharCode(message[7])}`,
          scoreHome: parseInt(String.fromCharCode(message[8]) + String.fromCharCode(message[9]) + String.fromCharCode(message[10])),
          scoreGuest: parseInt(String.fromCharCode(message[11]) + String.fromCharCode(message[12]) + String.fromCharCode(message[13])),
          period: parseInt(String.fromCharCode(message[14]))
      };
  }

  // function startServer () {
  //   const net = require('node:net');
  //     const server = net.createServer((socket) => {
  //         socket.on('data', (data) => {
  //             try {
  //                 const messageDetails = parseMessage(data);
  //                 socket.write(`Received ${JSON.stringify(messageDetails)} (${data.toString('hex')})`);
  //             } catch (error) {
  //                 console.error('Failed to parse message:', error.message);
  //             }
  //         });
  //         socket.on('end', () => {
  //             console.log('Client disconnected');
  //         });
  //     });

  //     server.listen(PORT, () => {
  //         messageManager.sendMessage(`TCP server listening on port ${PORT}`);
  //     });
  // }

  return {
      // startServer: startServer,
      parseMessage: parseMessage,
      calculateLRC: calculateLRC
  };
})();

module.exports.onStart = function () {
  messageManager.init();
};

module.exports.onRequest = function () {
  messageManager.sendMessage("module.exports.onRequest callback");
  var reqAppControl = tizen.application.getCurrentApplication().getRequestedAppControl();

  if (reqAppControl && reqAppControl.appControl.operation == "http://tizen.org/appcontrol/operation/pick") {
      var data = reqAppControl.appControl.data;
      if (data[0].value[0] == 'ForegroundApp') {
          messageManager.sendMessage("module.exports.onRequest callback. " + data[0].value[0] + ".");
      }
  }
};

module.exports.onExit = function (e) {
  messageManager.sendMessage("Service is exiting... " + e);
  messageManager.sendCommand("terminated");
};
