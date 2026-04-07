require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const fs = require("fs");

// Prevent multer crash by auto-creating the uploads folder if it's missing on the real server
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend to call APIs
app.use(express.static(__dirname));
app.use("/uploads", express.static(__dirname + "/uploads")); // Serve uploaded files

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        db = client.db("campus_portal");
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.log("❌ Error:", err);
    }
}

connectDB();

// ═══════════════════════════════════════
// AUTHENTICATION APIs
// ═══════════════════════════════════════

// Signup
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        // Check if user exists
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        await db.collection("users").insertOne(newUser);
        res.status(201).json({ message: "User created securely" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during registration" });
    }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const user = await db.collection("users").findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Simplified token for demonstration (usually this would be a JWT)
        const token = user._id.toString();

        res.json({
            message: "Login successful",
            token: token,
            user: { name: user.name, email: user.email }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during login" });
    }
});

// ═══════════════════════════════════════
// REQUESTS APIs
// ═══════════════════════════════════════

// Create a Request
app.post("/api/requests", upload.single("evidence"), async (req, res) => {
    try {
        const data = {
            name: req.body.name,
            type: req.body.type,
            year: req.body.year,
            hostel: req.body.hostel,
            category: req.body.category,
            issue: req.body.issue,
            image: req.file ? req.file.filename : null,
            createdAt: new Date()
        };

        await db.collection("requests").insertOne(data);

        console.log("Saved:", data);
        res.status(201).json({ message: "Request Saved", request: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error saving request" });
    }
});


// GET all requests
app.get("/api/requests", async (req, res) => {
    try {
        // Sort descending by creation date (newest first)
        const requests = await db.collection("requests").find().sort({ createdAt: -1 }).toArray();
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching requests" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});