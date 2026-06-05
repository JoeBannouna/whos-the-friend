const RoomInputValidator = {
    createRoom(roomName, password) {
        let validationObject = { success: true, msg: '' };
        if (roomName.trim() == '')
            return { success: false, msg: 'Room name cannot be empty.' };
        if (roomName.length < 2)
            return { success: false, msg: 'Room name is too short' };
        return validationObject;
    },
};
export default RoomInputValidator;
//# sourceMappingURL=RoomInputValidator.js.map