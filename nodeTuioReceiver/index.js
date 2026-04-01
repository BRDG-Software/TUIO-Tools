const osc = require('node-osc');

// Create an OSC server that listens on port 3333 and all interfaces (0.0.0.0)
const oscServer = new osc.Server(3333, '0.0.0.0');

console.log('TUIO server listening on port 3333...');

// Listen for all messages
oscServer.on('message', function (msg, rinfo) {
    console.log("Received TUIO message:");
    console.log(msg); // msg is an array: [<address>, <typetags>, <values>*]
    // Example output might be: [ '/tuio/2Dcur', 'sif', 'set', 1, 0.5, 0.5 ]

    // You can also listen for specific TUIO addresses, e.g., '/tuio/2Dcur'
    if (msg[0] === '/tuio/2Dcur') {
        // Process cursor data
        const command = msg[1]; // e.g., 'set', 'alive', 'fseq'
        const sessionID = msg[2];
        // further values like x-pos, y-pos, velocity etc.
        if (command === 'set') {
          const xPos = msg[3];
          const yPos = msg[4];
          console.log(`Cursor ${sessionID} moved to: (${xPos}, ${yPos})`);
        }
    }
});

oscServer.on('error', function (err) {
    console.error('OSC server error:', err);
});
