const DIRECTION = {
    left: 1,
    right: 2,
    up: 3,
    down: 4,
};

function createRenderer(canvas) {

    const EMPTY_CELL = "#55cb02"
    const WALL_CELL = "#aa2800"

    const STATE_CELL_TYPE = {
        player: "player",
        bullet: "bullet"
    }

    const CELL_STATE = {
        empty: 0,
        wall: 1,
    };

    const getPlayerColor = (id) => {
        const baseColors = [0x1fa4a9, 0x721fa9, 0xa91f89, 0xff6767]
        const baseColor = baseColors[id % baseColors.length]
        const color = baseColor + id * 16 + id * 512 + id * 2048;
        return "#" + color.toString(16)
    }

    const context = canvas.getContext("2d");
    return {
        render: (state) => {
            context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
            const cellsCountInHeight = state.length
            const cellsCountInWidth = state[0].length

            const cellWidth = canvas.clientWidth / cellsCountInWidth
            const cellHeight = canvas.clientHeight / cellsCountInHeight

            const drawRect = (x, y, w, h, color) => {
                context.fillStyle = color
                context.fillRect(x, y, w, h)
            }

            const drawEmpty = (x, y) => {
                drawRect(x, y, cellWidth, cellHeight, EMPTY_CELL)
            }

            const drawWall = (x, y) => {
                drawRect(x, y, cellWidth, cellHeight, WALL_CELL)
            }

            const drawPlayer = (x, y, entity) => {
                const color = getPlayerColor(entity.playerId)
                // TODO:
                const direction = entity.direction
                drawRect(x, y, cellWidth, cellHeight, color)
                let newX = 0
                let newY = 0
                let newWidth = 0
                let newHeight = 0
                switch (direction) {
                    case DIRECTION.left :
                        newX = x
                        newY = y + cellHeight / 2 - cellHeight / 16
                        newWidth = cellWidth / 8
                        newHeight = cellWidth / 8
                        break
                    case DIRECTION.right :
                        newX = x + cellWidth - cellWidth / 8
                        newY = y + cellHeight / 2 - cellHeight / 16
                        newWidth = cellWidth / 8
                        newHeight = cellWidth / 8
                        break
                    case DIRECTION.up :
                        newX = x + cellWidth / 2 - cellWidth / 16
                        newY = y
                        newWidth = cellWidth / 8
                        newHeight = cellWidth / 8
                        break
                    case DIRECTION.down :
                        newX = x + cellWidth / 2 - cellWidth / 16
                        newY = y + cellHeight - cellHeight / 8
                        newWidth = cellWidth / 8
                        newHeight = cellWidth / 8
                        break
                }
                const dotColor = "#ff0000"
                drawRect(newX, newY, newWidth, newHeight, dotColor)
            }

            const drawBullet = (x, y, entity) => {
                const color = getPlayerColor(entity.playerId)
                const newX = x + cellWidth / 4 + cellWidth / 8
                const newY = y + cellHeight / 4 + cellWidth / 8
                const newWidth = cellWidth / 4
                const newHeight = cellWidth / 4
                drawRect(newX, newY, newWidth, newHeight, color)
            }

            for (let y = 0; y < state.length; y++) {
                for (let x = 0; x < state[y].length; x++) {
                    const currentCell = state[y][x];
                    const realX = x * cellWidth
                    const realY = y * cellHeight

                    if (currentCell.state === CELL_STATE.empty) {
                        drawEmpty(realX, realY)
                    } else {
                        drawWall(realX, realY)
                    }

                    if (currentCell.type) {
                        if (currentCell.type === STATE_CELL_TYPE.player) {
                            drawPlayer(realX, realY, currentCell)
                        }
                        if (currentCell.type === STATE_CELL_TYPE.bullet) {
                            drawBullet(realX, realY, currentCell)
                        }
                    }
                }
            }
        }
    }
}

function initInputHandler(socket) {
    const GAME_ACTION = {
        shoot: "shoot",
        move: "move",
    };

    const MOVE_KEYS = {
        "w": DIRECTION.up,
        "a": DIRECTION.left,
        "d": DIRECTION.right,
        "s": DIRECTION.down,
    }

    const ACTION_KEYS = {
        " ": "shoot"
    }

    const allKeys = {...MOVE_KEYS, ...ACTION_KEYS};

    document.addEventListener('keypress', (event) => {
        const keyName = event.key;
        if (Object.keys(allKeys).includes(keyName)) {
            let action = {};
            if (Object.keys(MOVE_KEYS).includes(keyName)) {
                action = {
                    action: GAME_ACTION.move,
                    data: MOVE_KEYS[keyName]
                }
            } else {
                action = {
                    action: GAME_ACTION.shoot,
                }
            }
            socket.send(JSON.stringify(action))
        }
    });
}

export function initGame(socket, canvas) {
    const renderer = createRenderer(canvas)
    initInputHandler(socket)

    socket.onmessage = (message) => {
        const data = JSON.parse(message.data)
        renderer.render(data.state)
    }

    socket.onerror = (err) => {
        console.error(err)
        alert("Error on socket")
    }
}
