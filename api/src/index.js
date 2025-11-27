import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import authRouter from "./routers/authRouter.js";
import courseRouter from "./routers/courseRouter.js";
import adminRouter from "./routers/adminRouter.js";
import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import enrollRouter from "./routers/enrollRouter.js";
import certificateRouter from "./routers/certificate.js";
import ratingRouter from "./routers/ratingRouter.js";
import {
  getAllCategories,
  getCategoryById,
} from "../controllers/dynamodb/categoryController.js";
import { initializeWebSocket } from "./websocket/socketHandler.js";

const app = express();
const httpServer = createServer(app);

const corsOptions = {
  origin: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: corsOptions,
  path: "/socket.io/",
});

// Initialize WebSocket handlers
initializeWebSocket(io);

// Initialize S3 Client with AWS SDK v3
// Extract bucket region from S3 base URL or use default
const bucketRegion = process.env.AWS_S3_BASE_URL?.includes("eu-north-1")
  ? "eu-north-1"
  : process.env.AWS_REGION;

const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.use(bodyParser.json());
app.use(cookieParser());

// Set up Multer for file uploads with S3
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // unique key or path for the file
      const fileKey = `uploads/${Date.now()}-${file.originalname}`;
      console.log(`Uploading file to S3: ${fileKey}`);
      cb(null, fileKey);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"), false);
    }
  },
});

const apiRouter = express.Router();

// Endpoint for uploading files
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File uploaded successfully:", {
      key: req.file.key,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // Extracting the key (path) of the uploaded file
    const fileKey = req.file.key;
    res.json({
      message: "File uploaded successfully",
      fileKey: fileKey,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      error: "Failed to upload file",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to UpSkillPro API Infrastructure");
});

apiRouter.use("/", authRouter);
// Category routes - placed before course routes for proper ordering
apiRouter.get("/categories", getAllCategories);
apiRouter.get("/categories/:id", getCategoryById);
apiRouter.use("/courses", courseRouter);
apiRouter.use("/enroll", enrollRouter);
apiRouter.use("/certificate", certificateRouter);
apiRouter.use("/", ratingRouter);
// Admin routes - protected by super admin authorization
apiRouter.use("/admin", adminRouter);
app.use("/api", apiRouter);

//middleware for handling errors
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size is too large. Maximum size is 100MB." });
    }
    return res.status(400).json({ error: err.message });
  }

  // Handle custom errors
  if (err.status === 404) {
    return res.status(404).json({ message: err.message });
  }

  // Handle all other errors
  res.status(500).json({
    message: "An unexpected error occurred!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

httpServer.listen(process.env.PORT, () => {
  console.log(`API listening on port ${process.env.PORT}`);
  console.log(`WebSocket server initialized on port ${process.env.PORT}`);
});

// Export io for use in controllers
export { io };
