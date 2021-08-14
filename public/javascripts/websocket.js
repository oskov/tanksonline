export async function initWebSocket(host) {
    return new Promise((resolve, reject) => {
        console.log(`Connect to ${host}`)
        const socket = new WebSocket(`ws://${host}`);
        socket.onopen = () => {
            resolve(socket)
        }
        socket.onerror = (err) => {
            reject(err)
        }
    })
}
