import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";

class SocketService {
    private io: Server | null = null;
    private onlineUsers = new Map<string, string>(); 

    init(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:5173",
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
                socket.join(appointmentId);
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
}

export const socketService = new SocketService();
