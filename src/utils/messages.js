const generateMessage = (text,username) =>{
    return {
        text,
        username,
        'createdAt': new Date().getTime()
    }
}

generateLocationMessage = (url,username) =>{
    return {
        url,
        username,
        'createdAt': new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}