interface ValidationObject {
    success: boolean;
    msg: string;
}
interface IRoomInputValidator {
    createRoom(roomName: string, password: string): ValidationObject;
}
declare const RoomInputValidator: IRoomInputValidator;
export default RoomInputValidator;
//# sourceMappingURL=RoomInputValidator.d.ts.map