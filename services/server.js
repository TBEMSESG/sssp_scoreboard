
// Define the port the tcp server should listen to: 
var PORT = 4004;
var httpPORT = 3000;


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
      sendMessage(PORT, 'deviceInfo' )
      // startHttpServer() //This starts an http server to provide Settings or informations. Not used yet
  }

  function sendCommand (msg) {
      var messageData = { key: 'Command', value: msg };
      remoteMsgPort.sendMessage([messageData]);
  }

  function sendMessage (msg, key) {
      var messageData = { key: key || 'broadcast', value: msg };
      remoteMsgPort.sendMessage([messageData]);
  }
  function sendData (msg, key) {
    var messageData = { key: key || 'data', value: JSON.stringify(msg) };
    remoteMsgPort.sendMessage([messageData]);
}

  function close () {
      localMsgPort.removeMessagePortListener(listenerId);
  }

  function onMessageReceived(data) {
      sendMessage('BG service receive data: ' + JSON.stringify(data));
      
      }
  

  return {
      init: init,
      sendMessage: sendMessage,
      sendCommand: sendCommand,
      sendData: sendData
  };
})();


var tcpServer = (function () {

  function calculateLRC(data) {
    var lrc = 0;
    for (var i = 1; i < data.length - 2; i++) {
        lrc ^= data[i];
    }
    lrc &= 0x7F;
    if (lrc < 0x20) {
        lrc += 0x20;
    }
    return lrc;
}

function parseMessage(data) {
    if (data[0] !== 0x01 || data[data.length - 2] !== 0x03) {
        throw new Error('Invalid message format');
    }

    var message = data.slice(4, data.length - 2);
    var calculatedLRC = calculateLRC(data);
    var receivedLRC = data[data.length - 1];

    if (calculatedLRC !== receivedLRC) {
        throw new Error('LRC mismatch. Message may be corrupted');
    }

      return {
          time: String.fromCharCode(message[4])+String.fromCharCode(message[5])+':'+ String.fromCharCode(message[6])+String.fromCharCode(message[7]),
          scoreHome: parseInt(String.fromCharCode(message[8]) + String.fromCharCode(message[9]) + String.fromCharCode(message[10])),
          scoreGuest: parseInt(String.fromCharCode(message[11]) + String.fromCharCode(message[12]) + String.fromCharCode(message[13])),
          period: parseInt(String.fromCharCode(message[14]))
      };
  }

  function startServer () {

    const net = require('net');

      const server = net.createServer(function (socket) {
          socket.on('data', function (data) {

            // messageManager.sendMessage('Received ' + data.toString('hex'))
            
            if (Buffer.isBuffer(data)) {
              try {
                messageManager.sendMessage('Is Buffer ...')

                  const messageDetails = parseMessage(data);
                  messageManager.sendData(messageDetails);
                  
                  //socket.write('Received ' + data.toString('hex'));
              } 
              catch (error) {
                  messageManager.sendMessage('Failed to parse message' + error.message)
                  socket.write(error.message);
              }
            }
            else {
                messageManager.sendMessage('not a buffer....')
 
            }

          });

          socket.on('end', function () {
            messageManager.sendMessage('client disconnected...')
          });

          socket.on('error', function (error) {
            messageManager.sendMessage('catched an Error...')
          });
      });

      server.listen(PORT, function () {
          messageManager.sendMessage('TCP server listening on port' + PORT);
      });
  }



  return {
      startServer: startServer,
      startHttpServer: startHttpServer,
      // parseMessage: parseMessage,
      // calculateLRC: calculateLRC
  };
})();


function startHttpServer () {
  var http = require('http');

var htmlData= `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enter a Value</title>
</head>
<body>

    <h2>Current PORT = ${PORT}</h2>

    <!-- HTML Form -->
    <form action="/submit" method="POST">
        <label for="value">Enter a new PORT number:</label>
        <input type="text" id="value" name="value" required>
        
        <button type="submit">Submit</button>
    </form>

</body>
</html>`
  var httpServer = http.createServer((req, res) => {
    // Serve the HTML page for the root path
    if (req.url === '/') {
        
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlData); // Send HTML content as response
        ;
    } else {
        // Handle 404 for other routes
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// Start the server
httpServer.listen(httpPORT, () => {
    messageManager.sendMessage('Server is running on http://localhost:' +httpPORT);

});
}  




module.exports.onStart = function () {
  messageManager.init();
  tcpServer.startServer();
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

module.exports.onExit = function () {
    // messageManager.init();
    // tcpServer.startServer();

  // messageManager.sendMessage("Service is restarting... ");
  messageManager.sendCommand("terminated");
};
