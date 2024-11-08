

const tcpServer = (function () {


    const net = require('net');

    // Environment Variables
    const PORT = 4000;

// The following part handles the tcp listener and message decoding
// Function to calculate LRC
const calculateLRC = (data) => {
  let lrc = "";

  // XOR each byte between Address (after SOH) and ETX (included)
  for (let i = 1; i < data.length - 2; i++) { // Exclude SOH (first byte) and LRC (last byte)
    lrc ^= data[i];
  }

  // Apply 7-bit mask
  lrc &= 0x7F;

  // Adjust if LRC is less than 0x20
  if (lrc < 0x20) {
    lrc += 0x20;
  }

  return lrc;
};

// Function to parse incoming message
const parseMessage = (data) => {
  // Check if the message starts with SOH (0x01) and ends with ETX (0x03)
  if (data[0] !== 0x01 || data[data.length - 2] !== 0x03) {
    throw new Error(`Schould be 01, is ${data[0]}, should be 03, is ${data[data.length-2]} - 'Invalid message format'`);
  }

  // Extract parts of the message
  const address = data[1];        // Address (ignored for processing but used in LRC)
  const stx = data[2];            // STX, should be 0x02
  const ctrl = data[3];           // Control byte (ignored for processing but used in LRC)
  const message = data.slice(4, data.length - 2);  // Message content
  const etx = data[data.length - 2];  // ETX, should be 0x03
  const receivedLRC = data[data.length - 1];  // Last byte is the LRC

  console.log( `
    Third Bit = ${stx},
    Message = ${message.toString('hex')},
    ETX (should be 03) = ${etx}, 
    Received LRC = ${receivedLRC}
    `)

  // Calculate LRC to validate message integrity
  const calculatedLRC = calculateLRC(data);

  if (calculatedLRC !== receivedLRC) {
    throw new Error(`LRC mismatch. Message may be corrupted calculated ${calculatedLRC}`);
  }

  // Further parse the `message` content based on specific requirements
  // Here we are simulating parsing as per `parse_message_11` style from bodet_tcp.py
  const parsedDetails = {};

  // Example: Assume we have time data in certain bytes and scores in others
  // Parsing minutes and seconds from specific byte positions
  parsedDetails.time = `${String.fromCharCode(message[4])}${String.fromCharCode(message[5])}:${String.fromCharCode(message[6])}${String.fromCharCode(message[7])}`;

  // Example: Assume score positions and convert ASCII to integers
  parsedDetails.scoreHome = parseInt(String.fromCharCode(message[8]) + String.fromCharCode(message[9]) + String.fromCharCode(message[10]));
  parsedDetails.scoreGuest = parseInt(String.fromCharCode(message[11]) + String.fromCharCode(message[12]) + String.fromCharCode(message[13]));

  // Additional parsed details based on message structure can be added here
  parsedDetails.period = parseInt(String.fromCharCode(message[14]));

  return parsedDetails;
};

const startServer = () => {
      // Set up the TCP server
      const server = net.createServer((socket) => {
        console.log('Client connected');

        // Handle incoming data
        socket.on('data', (data) => {
          try {
            console.log(`DEBUG: RAW Data received: ${data.toString('hex')}`)  
            const messageDetails = parseMessage(data);
            console.log('Parsed Message:', messageDetails);
              socket.write(`received ${JSON.stringify(messageDetails)} (${data.toString('hex')}) `);
          } catch (error) {
            console.error('Failed to parse message:', error.message);
          }
        });

        // Handle client disconnection
        socket.on('end', () => {
          console.log('Client disconnected');
        });
      });

      // Start the server

      server.listen(PORT, () => {
        // console.log(`TCP server listening on port ${PORT}`);
        sendMessage("TCP server listening on port" + PORT)
      });
}
})

module.exports = tcpServer