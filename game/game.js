const SECOND_IN_MILIS = 1000
const TICK_PER_SECOND = 1000 / 30
const SCALE = 2;
const GAME_FIELD_HEIGHT = 9 * SCALE
const GAME_FIELD_WIDTH = 16 * SCALE
const SHOOT_PERIOD = 1 * SECOND_IN_MILIS // 1000, bcs milis
const MOVE_PERIOD = 0.2 * SECOND_IN_MILIS
const BULLET_LIFE_TIME = 5 * SECOND_IN_MILIS
const DIRECTION = {
    left: 1,
    right: 2,
    up: 3,
    down: 4,
};

const CELL_STATE = {
    empty: 0,
    wall: 1,
};
const GAME_ACTION = {
    shoot: "shoot",
    move: "move",
};

const STATE_CELL_TYPE = {
    player: "player",
    bullet: "bullet"
}

const getCurrentMilis = () => {
    return Date.now();
}

class Bullet {
    static lastBulletId = 0;

    constructor(player) {
        this.direction = player.direction;
        this.playerId = player.playerId;
        this.bulletId = Bullet.lastBulletId++
        this.creationTime = getCurrentMilis()
        switch (player.direction) {
            case DIRECTION.left:
                this.y = player.y;
                this.x = player.x - 1;
                break;
            case DIRECTION.right:
                this.y = player.y;
                this.x = player.x + 1;
                break;
            case DIRECTION.up:
                this.y = player.y - 1;
                this.x = player.x;
                break;
            case DIRECTION.down:
                this.y = player.y + 1;
                this.x = player.x;
        }
    }

    direction = DIRECTION.left;
    x = -1;
    y = -1;
    playerId = 0;
    timeSinceLastMove = 0;
    creationTime = 0;
    bulletId = 0;
}

class Player {
    constructor(x, y, playerId) {
        this.y = y;
        this.x = x;
        this.playerId = playerId;
    }

    direction = DIRECTION.left;
    x = -1;
    y = -1;
    playerId = null;
    timeSinceLastShot = 0;
    timeSinceLastMove = 0;
}

class Cell {
    constructor() {
        this.state = Math.random() < 0.5 ? CELL_STATE.wall : CELL_STATE.empty;
    }

    bullet = null;
    player = null;
    state = CELL_STATE.empty;

    clear() {
        this.bullet = null
        this.player = null
        this.state = CELL_STATE.empty
    }

    hasEntity() {
        return this.bullet !== null || this.player !== null
    }

    isEmpty() {
        return !this.hasEntity() && this.state === CELL_STATE.empty
    }
}

class Game {
    _gameTick = null
    _gameField = null
    _bullets = null
    _players = null
    _lastPlayerId = 0

    constructor() {
        this._gameField = new Array(GAME_FIELD_HEIGHT).fill(0).map(val => {
            return new Array(GAME_FIELD_WIDTH).fill(0).map(val => {
                return new Cell()
            })
        });
        this._players = [];
        this._bullets = [];
        this._gameTick = setInterval(() => this.update(), TICK_PER_SECOND)
    }

    stop() {
        this._gameTick = null
        clearInterval(this._gameTick)
    }

    _getNextEntityStep(entity) {
        let x = entity.x, y = entity.y;
        switch (entity.direction) {
            case DIRECTION.left:
                x = entity.x - 1;
                break;
            case DIRECTION.right:
                x = entity.x + 1;
                break;
            case DIRECTION.up:
                y = entity.y - 1;
                break;
            case DIRECTION.down:
                y = entity.y + 1;
        }
        return [x, y];
    }

    _moveToDirection(entity, key) {
        this._gameField[entity.y][entity.x][key] = null
        const [tempx, tempy] = this._getNextEntityStep(entity);
        entity.x = tempx
        entity.y = tempy
        this._gameField[entity.y][entity.x][key] = entity
    }

    _playersUpdate() {
        const currentMillis = getCurrentMilis()
        for (let player of this._players) {
            const [tempx, tempy] = this._getNextEntityStep(player);
            if (!(tempx >= 0 && tempx < GAME_FIELD_WIDTH
                && tempy >= 0 && tempy < GAME_FIELD_HEIGHT
                && this._gameField[tempy][tempx].isEmpty())) {
                continue
            }
            if (player.timeSinceLastMove > currentMillis - MOVE_PERIOD) {
                continue
            }
            this._moveToDirection(player, "player")
            player.timeSinceLastMove = currentMillis
        }
    }

    _deleteBullet(bulletId) {
        this._bullets = this._bullets.filter(bullet => bullet.bulletId !== bulletId)
    }

    _processBulletCollision(bullet) {
        const newX = bullet.x
        const newY = bullet.y

        const bulletCell = this._gameField[newY][newX]
        if (bulletCell.state === CELL_STATE.wall) {
            bulletCell.clear()
            return true
        }
        if (bulletCell.player != null) {
            this.removePlayer(bulletCell.player.playerId)
            bulletCell.clear()
            return true
        }
        return false
    }

    _bulletsUpdate() {
        const currentMillis = getCurrentMilis()
        const bulletsForDeletion = []
        for (const bullet of this._bullets) {
            if (bullet.creationTime < currentMillis - BULLET_LIFE_TIME) {
                bulletsForDeletion.push(bullet)
                this._gameField[bullet.y][bullet.y].bullet = null
                continue
            }

            const shouldDeleteBullet = this._processBulletCollision(bullet)
            if (shouldDeleteBullet) {
                bulletsForDeletion.push(bullet)
                continue
            }

            const [tempx, tempy] = this._getNextEntityStep(bullet);
            if (!(tempx >= 0 && tempx < GAME_FIELD_WIDTH
                && tempy >= 0 && tempy < GAME_FIELD_HEIGHT)) {
                bulletsForDeletion.push(bullet)
                this._gameField[bullet.y][bullet.y].bullet = null
                continue
            }
            if (bullet.timeSinceLastMove > currentMillis - MOVE_PERIOD / 2) {
                continue
            }
            this._moveToDirection(bullet, "bullet")
            bullet.timeSinceLastMove = currentMillis
        }
        for (const bullet of bulletsForDeletion) {
            this._deleteBullet(bullet.bulletId)
        }
    }

    update() {
        if (this._bullets?.length) {
            this._bulletsUpdate()
        }
        if (this._players?.length) {
            this._playersUpdate()
        }
    }

    addPlayer() {
        this._lastPlayerId++;
        let x, y;
        let findNewCellCounter = 0;
        do {
            // Returns a random integer from 0 to 15
            x = Math.floor(Math.random() * (GAME_FIELD_WIDTH));
            y = Math.floor(Math.random() * (GAME_FIELD_HEIGHT));

            findNewCellCounter++;
            if (findNewCellCounter >= 15 && !this._gameField[x][y].hasEntity()) {
                this._gameField[y][x].state = CELL_STATE.empty
            }
        } while (!this._gameField[y][x].isEmpty());
        const newPlayer = new Player(x, y, this._lastPlayerId)
        this._players.push(newPlayer);
        this._gameField[y][x].player = newPlayer
        return this._lastPlayerId;
    }

    removePlayer(playerId) {
        this._players = this._players.filter(player => player.playerId !== playerId)
    }

    _getPlayerById(playerId) {
        return this._players.find(item => item.playerId === playerId)
    }

    _movePlayer(playerId, direction) {
        let player = this._getPlayerById(playerId)
        player.direction = direction
    }

    _shootPlayer(playerId) {
        const currentMillis = getCurrentMilis()
        let player = this._getPlayerById(playerId)
        if (player.timeSinceLastShot > currentMillis - SHOOT_PERIOD) {
            return
        }
        const bullet = new Bullet(player)
        if (bullet.y < 0 || bullet.y >= GAME_FIELD_HEIGHT
            || bullet.x < 0 || bullet.x >= GAME_FIELD_WIDTH) {
            return
        }
        this._bullets.push(bullet)
        this._gameField[bullet.y][bullet.x].bullet = bullet
        player.timeSinceLastShot = currentMillis
    }

    /**
     * @param inputCommand {{playerId: int, action: string, data: int}}, action like move/shoot
     */
    handleInput(inputCommand) {
        if (!this._getPlayerById(inputCommand.playerId)) {
            return
        }

        switch (inputCommand.action) {
            case GAME_ACTION.move:
                this._movePlayer(inputCommand.playerId, inputCommand.data)
                break
            case GAME_ACTION.shoot:
                this._shootPlayer(inputCommand.playerId)
        }
    }

    getState() {
        const state = this._gameField.map(row => {
            return row.map(cell => ({state: cell.state}));
        });
        for (const player of this._players) {
            const x = player.x
            const y = player.y
            const playerId = player.playerId
            const direction = player.direction
            state[y][x] = {...state[y][x], type: STATE_CELL_TYPE.player, playerId, direction}
        }

        for (const bullet of this._bullets) {
            const x = bullet.x
            const y = bullet.y
            const playerId = bullet.playerId
            const direction = bullet.direction
            state[y][x] = {...state[y][x], type: STATE_CELL_TYPE.bullet, playerId, direction}
        }
        return state
    }

}

module.exports = {
    Game,
    settings: {
        CELL_STATE,
        DIRECTION,
        TICK_PER_SECOND,
        GAME_FIELD_HEIGHT,
        GAME_FIELD_WIDTH,
        SHOOT_RELOAD_IN_SECONDS: SHOOT_PERIOD,
        GAME_ACTION,
        STATE_CELL_TYPE
    }
}
