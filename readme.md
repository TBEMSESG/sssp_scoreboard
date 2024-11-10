# Boded ScorePad

## Application for Samsung Tizen 4.0 - 8.0

!!! Warning DEV Version only, not Production ready!

Runs on Tizen B2B Displays with Tizen 4.0 up to Tizen 8.0.

This app runs a simple scoreboard frontend with a background service application. The backend listens to a tcp connection from the Boded ScorePad, to show the current scores for Home and Guest teams, the current Period, and the current Time.

>[!Note] The app is hardcoded for IceHockey only, eventhough the scorePad could provide a lot of other sports too.

>[!Info] Data parsing for other sports might be added later. 

The SSSP app only runs with a Boded ScorePad TCP Output. The messages are given and the parsing is not changable without changing the code. 

### Modify the application
first clone a copy to your localhost, then import into Tizen Studio.

Choose a folder on your local pc, then
```sh
git clone https://github.com/TBEMSESG/sssp_scoreboard.git
cd sssp_scoreboard
```

Import the folder `sssp_scoreboard` into Tizen Studio.


### Service Application (Backend)
Runs a node:net TCP Server, listening on a default port for incoming connections. 
Every incoming connection is then parsed against the Boded ScorePad Ethernet output protocoll, and in case it's correct, the data is passed to the frontend which then displays the data. 

### SSSP App (Frontend)
Simple Scoreboard with HomeScore, GuestScore, Period and Time. 

!!! Info Currently the application runs in debug mode, which shows all the received messages and all logs between backend and frontend.
