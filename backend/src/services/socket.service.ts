import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "../configs/env"

export class SocketService {
    private _io: Server | null = null;
    private _onlineUsers = new Map<string, string>();

    init(httpServer: HttpServer) {
        const envOrigins = [env.CLIENT_URL, env.CLIENT_URL_1, env.CLIENT_URL_2]
            .filter((url): url is string => !!url)
            .map(url => url.trim());






        this._io = new Server(httpServer, {
            cors: {
                origin: [
                    ...envOrigins,
                    "https://takecare.nithin.site",
                    "https://www.takecare.nithin.site",
                    "http://localhost:5173",
                    "http://localhost:3000"
                ],
                methods: ["GET", "POST"],
                credentials: true
            },
        });

        this._io.on("connection", (socket: Socket) => {

            socket.on("call-user", ({ userToCall, signalData, from, name, isRejoin }) => {
                this._io?.to(userToCall).emit("call-user", { signal: signalData, from, name, isRejoin });
            });

            socket.on("answer-call", (data) => {
                this._io?.to(data.to).emit("call-accepted", data.signal);
            });

            socket.on("ice-candidate", ({ to, candidate }) => {
                this._io?.to(to).emit("ice-candidate", candidate);
            });

            socket.on("end-call", ({ to }) => {
                this._io?.to(to).emit("call-ended");
            });


            socket.on("join", (userId: string) => {
                socket.join(userId);
                this._onlineUsers.set(userId, socket.id);
                this._io?.emit("user-status", { userId, status: 'online' });


                const onlineUserIds = Array.from(this._onlineUsers.keys());
                socket.emit("online-users", onlineUserIds);
            });

            socket.on("join-chat", (roomId: string) => {
                const room = String(roomId);
                socket.join(room);
            });

            socket.on("leave-chat", (roomId: string) => {
                const room = String(roomId);
                socket.leave(room);
            });

            socket.on("typing", ({ id, userId }: { id: string, userId: string }) => {
                socket.to(id).emit("user-typing", { id, userId, isTyping: true });
            });

            socket.on("stop-typing", ({ id, userId }: { id: string, userId: string }) => {
                socket.to(id).emit("user-typing", { id, userId, isTyping: false });
            });

            socket.on("mark-read", ({ id, userId }: { id: string, userId: string }) => {
                socket.to(id).emit("messages-read", { id, userId });
            });

            socket.on("send-message", (data: Record<string, unknown>) => {
                const roomId = String(data.conversationId || data.appointmentId || "");
                if (roomId) {

                } else {
                }
            });

            socket.on("disconnect", () => {
                let disconnectedUserId = "";
                for (const [uid, sid] of this._onlineUsers.entries()) {
                    if (sid === socket.id) {
                        disconnectedUserId = uid;
                        this._onlineUsers.delete(uid);
                        break;
                    }
                }
                if (disconnectedUserId) {
                    this._io?.emit("user-status", { userId: disconnectedUserId, status: 'offline' });

                }
            });
        });
    }

    isUserOnline(userId: string): boolean {
        return this._onlineUsers.has(userId);
    }

    notify(userId: string, data: unknown) {
        if (this._io) {
            this._io.to(userId.toString()).emit("notification", data);
        }
    }

    sendReminder(userId: string, data: unknown) {
        if (this._io) {
            this._io.to(userId.toString()).emit("appointment-reminder", data);
        }
    }

    clearNotifications(userId: string) {
        if (this._io) {
            this._io.to(userId.toString()).emit("clear-notifications");
        }
    }

    emitMessage(appointmentId: string, message: unknown) {
        if (this._io) {
            this._io.to(appointmentId).emit("receive-message", message);
        }
    }

    emitToRoom(roomId: string, event: string, data: unknown) {
        if (this._io) {
            this._io.to(roomId).emit(event, data);
        }
    }

    emitToUser(userId: string, event: string, data: unknown) {
        if (this._io) {
            this._io.to(userId.toString()).emit(event, data);
        }
    }
}

export const socketService = new SocketService();
