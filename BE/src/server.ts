// server.ts
import cors from "cors";
import express from "express";
import http from "http";
import { Sequelize, DataTypes, Model } from "sequelize";
import { Server, Socket } from "socket.io";

const sequelize = new Sequelize("planit_socket", "root", "1234", {
  host: "localhost",
  dialect: "mysql",
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const corsOptions = {
  origin: "http://localhost:3001",
  credentials: true,
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;

const Role = sequelize.define("Role", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

interface RoomAttributes {
  roomId: string;
  creator: string;
}
const Room = sequelize.define("Room", {
  roomId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  creator: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// interface RoomInstance extends Model {
//   roomId: string;
//   creator: string;
// }

// Use the Room model and interface together
// For example:

// Synchronize the models with the database
(async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("Database & tables synced!");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
})();

app.post("/api/roles", async (req, res) => {
  try {
    const { name } = req.body;

    // Create a new role in the database
    const role = await Role.create({ name });

    res.status(201).json(role);
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post("/api/rooms", async (req, res) => {
  try {
    const { roomId, creator } = req.body;

    // Create a new role in the database
    const room = await Room.create({ roomId, creator });

    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log(roomId);
    const room = await Room.findOne({ where: { roomId } });
    if (room) {
      res.status(200).json({ data: room });
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

io.on("connection", (socket: Socket) => {
  console.log("New client connected");

  socket.on("createRoom", async (creator) => {
    try {
      const roomId = generateRoomId();

      console.log(creator);

      const currentTime = new Date().toLocaleTimeString();
      socket.join(roomId);

      io.to(roomId).emit("roomCreated", { roomId, currentTime, creator });

      await Promise.all([
        // Role.create({ name: "admin" }),
        // Role.create({ name: "user" }),
        Room.create({ roomId: roomId, creator: creator }),
      ]);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  });

  socket.on("joinRoom", (roomId: string, creator: string) => {
    socket.join(roomId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

function generateRoomId(): string {
  return Math.random().toString(36).substring(7);
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
