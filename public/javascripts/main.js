import {initWebSocket} from './websocket.js'
import {initGame} from "./game.js";

const setUpPage = () => {
    const btn = document.getElementById("connectBtn")
    const input = document.getElementById("connectInput")
    const label = document.getElementById("connectLabel")
    const canvas = document.getElementById("canvas")

    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    btn.onclick = () => {
        const ip = input.value
        const initialized = initWebSocket(ip)
        initialized.then(socket => {
            canvas.hidden = false
            label.hidden = true
            input.hidden = true
            btn.hidden = true
            initGame(socket, canvas)
        }).catch(err => {
            alert("Error while connecting to server")
            console.error(err)
        });
    }
}

setUpPage()
