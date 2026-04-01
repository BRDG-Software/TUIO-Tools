Tools for testing sending TUIO messages and receiving TUIO messages.

TO SEND
1. open cli inside "tuioSender" folder
2. run "npm install"
3. run "node --watch app.js"
The sender server should now be running, open "localhost:3000" in a web browser and click inside the blue rectangle to send a TUIO message. 

TO RECEIVE
1. open cli inside "nodeTuioReceiver" folder
2. run "npm install"
3. run "node index.js"
You should now see your TUIO coordinates coming through in the monitor. 