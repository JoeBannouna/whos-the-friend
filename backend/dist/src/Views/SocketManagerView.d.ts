import { type DefaultEventsMap, type Server } from 'socket.io';
interface ISocketManagerView {
    inializeSocketListeners(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>): Promise<boolean>;
}
declare const SocketManagerView: ISocketManagerView;
export default SocketManagerView;
//# sourceMappingURL=SocketManagerView.d.ts.map