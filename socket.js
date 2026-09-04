let io;

const initIO = (socketServer) => {
    io = socketServer
}

const getIO = () => {
    return io
}

module.exports = {
    initIO,
    getIO
}