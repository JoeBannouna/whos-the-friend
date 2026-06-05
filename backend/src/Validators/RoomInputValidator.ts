interface ValidationObject {
  success: boolean;
  msg: string;
}
interface IRoomInputValidator {
  createRoom(roomName: string, password: string): ValidationObject;
}

const RoomInputValidator: IRoomInputValidator = {
  createRoom(roomName: string, password: string) {
    let validationObject: ValidationObject = { success: true, msg: '' };

    if (roomName.trim() == '') return { success: false, msg: 'Room name cannot be empty.' };
    if (roomName.length < 2) return { success: false, msg: 'Room name is too short' };

    return validationObject;
  },
};

export default RoomInputValidator;
