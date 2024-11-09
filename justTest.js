var time, scoreHome, scoreGuest, period
    var PORT = 4001;
  
    function calculateLRC(data) {

        console.log('received the following to calculate LRC : ', data)
      var lrc = 0;
      
      for (var i = 1; i < data.length - 2; i++) {
          lrc ^= data[i];
          console.log(data[i], lrc)
      }

      lrc &= 0x7F;
      
      console.log('lrc after masking 7bit: ', lrc)
      if (lrc < 0x20) {
          lrc += 0x20;
        }
        
        console.log('Calculated LRC(dec) ', lrc)
      return lrc;
  }
  
  function parseMessage(data) {

    console.log('received following to parse : ', data)

      if (data[0] !== 0x01 || data[data.length - 2] !== 0x03) {
          throw new Error('Invalid message format');
         }
  
      var message = data.slice(4, data.length - 2);
         console.log('calculated lrc received in parsing: ', calculateLRC)
         var calculatedLRC = calculateLRC(data);
         
         var receivedLRC = data[data.length - 1];
         console.log('received LRC from buffer: ', receivedLRC)
  
      if (calculatedLRC != receivedLRC) {
          throw new Error('LRC mismatch. Message may be corrupted');
      }
  
        //return {
            time= String.fromCharCode(message[4])+String.fromCharCode(message[5])+':'+ String.fromCharCode(message[6])+String.fromCharCode(message[7]),
            scoreHome= parseInt(String.fromCharCode(message[8]) + String.fromCharCode(message[9]) + String.fromCharCode(message[10])),
            scoreGuest= parseInt(String.fromCharCode(message[11]) + String.fromCharCode(message[12]) + String.fromCharCode(message[13])),
            period= parseInt(String.fromCharCode(message[14]))
        //};

        console.log(time, scoreHome, scoreGuest, period)
    }
  
    function startServer () {
      const net = require('net');
        const server = net.createServer(function (socket) {
            socket.on('data', function (data) {
              console.log('Received ' + data.toString('hex'))
              
              if (Buffer.isBuffer(data)) {
                try {
                  console.log('Is Buffer ...', data)
  
                    const messageDetails = parseMessage(data);
                    
                    //messageManager.sendData(messageDetails);
                    
                  socket.write('Received ' + data.toString('hex'));
                } 
                catch (error) {
                    console.log('Failed to parse message')
                    socket.write(error.message);
                }
              }
              else {
                  console.log('not a buffer....')
   
              }
  
            });

            socket.on('error', function (error) {
                console.log('Error ...', error.message)
                console.log('Client disconnected');
              });
  
            socket.on('end', function () {
              console.log('client disconnected...')
              console.log('Client disconnected');
            });
        });
  
        server.listen(PORT, function () {
            console.log('TCP server listening on port' + PORT);
        });
    }
    startServer()