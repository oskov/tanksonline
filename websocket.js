const Websocket = require('ws');
const GameModule = require('./game/game.js')

function createWebsocketServer() {
    const wss = new Websocket.Server({port: 8080});

    const game = new GameModule.Game();

    wss.on('connection', function connection(ws) {
        const playerId = game.addPlayer()
        console.log("Connect player ", playerId)

        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
            const data = JSON.parse(message)
            game.handleInput({playerId, ...data})
        });
        const interval = setInterval(() => {
            const data = JSON.stringify({state: game.getState()})
            ws.send(data)
        }, GameModule.settings.TICK_PER_SECOND)

        ws.onclose = () => {
            console.log("Close player ", playerId)
            clearInterval(interval)
            game.removePlayer(playerId)
        }
        ws.onerror = (err) => {
            console.log("Error from player ", playerId, " | ", err)
        }
    });
    return wss
}

module.exports = createWebsocketServer

