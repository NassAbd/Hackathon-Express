const sendNotification = async (userList, userSelected, message) => {
    try {
        if (usersList[userSelected])
            await Promise.all(usersList[userSelected].map(x => x.emit("notification", message)))
        else
            throw new Error("User not connected");

        return true
    }
    catch (_e) {
        return false
    }
}
module.exports = sendNotification