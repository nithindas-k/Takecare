import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";

class SocketService {
    private io: Server | null = null;
    private onlineUsers = new Map<string, string>();

    init(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            },
        });

        this.io.on("connection", (socket: Socket) => {
            socket.on("join", (userId: string) => {
                socket.join(userId);
                this.onlineUsers.set(userId, socket.id);
                this.io?.emit("user-status", { userId, status: 'online' });
            });

            socket.on("join-chat", (appointmentId: string) => {
                const roomId = String(appointmentId);
                socket.join(roomId);
                console.log(`Socket [${socket.id}] joined room: ${roomId}`);
            });

            socket.on("leave-chat", (appointmentId: string) => {
                const roomId = String(appointmentId);
                socket.leave(roomId);
                console.log(`Socket [${socket.id}] left room: ${roomId}`);
            });

            socket.on("typing", ({ appointmentId, userId }: { appointmentId: string, userId: string }) => {
                socket.to(appointmentId).emit("user-typing", { userId, isTyping: true });
            });

            socket.on("stop-typing", ({ appointmentId, userId }: { appointmentId: string, userId: string }) => {
                socket.to(appointmentId).emit("user-typing", { userId, isTyping: false });
            });

            socket.on("mark-read", ({ appointmentId, userId }: { appointmentId: string, userId: string }) => {
                socket.to(appointmentId).emit("messages-read", { appointmentId, userId });
            });

            socket.on("send-message", (data: any) => {
                const roomId = String(data.appointmentId || "");
                if (roomId) {
                    console.log(`Socket [${socket.id}] sending message to room ${roomId}`);
                    this.io?.to(roomId).emit("receive-message", data);
                } else {
                    console.error("Socket error: send-message received without appointmentId");
                }
            });

            socket.on("disconnect", () => {
                let disconnectedUserId = "";
                for (let [uid, sid] of this.onlineUsers.entries()) {
                    if (sid === socket.id) {
                        disconnectedUserId = uid;
                        this.onlineUsers.delete(uid);
                        break;
                    }
                }
                if (disconnectedUserId) {
                    this.io?.emit("user-status", { userId: disconnectedUserId, status: 'offline' });
                }
            });
        });
    }

    isUserOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }

    notify(userId: string, data: any) {
        if (this.io) {
            this.io.to(userId.toString()).emit("notification", data);
        }
    }

    sendReminder(userId: string, data: any) {
        if (this.io) {
            this.io.to(userId.toString()).emit("appointment-reminder", data);
        }
    }

    clearNotifications(userId: string) {
        if (this.io) {
            this.io.to(userId.toString()).emit("clear-notifications");
        }
    }

    emitMessage(appointmentId: string, message: any) {
        if (this.io) {
            this.io.to(appointmentId).emit("receive-message", message);
        }
    }

    emitToRoom(roomId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(roomId).emit(event, data);
        }
    }
}

export const socketService = new SocketService();
