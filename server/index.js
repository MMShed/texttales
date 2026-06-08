const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const Usage = require("./models/Usage");

const crypto = require("crypto");

const User = require("./models/User");

const cookieParser = require("cookie-parser");
const cors = require("cors");

const Story = require("./models/Story");

const app = express();

app.set("trust proxy", 1);


app.use(cors({
  origin: true,
  credentials: true
}));


app.use(express.json());

const freeUserLimits = new Map();



const session = require("express-session");

app.use(session({
  name: "connect.sid",   
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,

  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "none",   
    maxAge: 24 * 60 * 60 * 1000
  }
}));



// Serve React build files
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.get("/stories", async (req, res) => {
  try {
    const stories = await Story.find({ ready: true })
    res.json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching stories ❌");
  }
});



const SECRET = process.env.ID_HASH_SECRET || "mysecret"; // add to env later

function hashIdentifier(value) {
  return crypto
    .createHash("sha256")
    .update(value + SECRET)
    .digest("hex");
}

app.get("/stories/:id", async (req, res) => {
  try {
    // ✅ Get user info
    const rawIP = req.headers["x-forwarded-for"] || req.ip;
    const ip = rawIP.split(",")[0].trim().replace("::ffff:", "");

    const userId = req.headers["x-user-id"];

    // ✅ FIX: properly detect logged-in users
    const isLoggedIn = userId && userId !== "null";

    // ✅ Check mode (from Explore pre-check)
    const isCheckOnly = req.query.check === "true";

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // ✅ ONLY track guests
    if (!isLoggedIn) {

      // ✅ Hash the IP (privacy-safe)
      const hashedId = hashIdentifier(ip);

      let data = await Usage.findOne({ identifier: hashedId });

      // ✅ Reset window
      if (!data || now - new Date(data.startTime).getTime() > ONE_DAY) {
        data = await Usage.findOneAndUpdate(
          { identifier: hashedId },
          {
            identifier: hashedId,
            count: 0,
            startTime: new Date()
          },
          { upsert: true, returnDocument: "after" }
        );
      }

      console.log("Guest count:", data.count);

      // ✅ LIMIT CHECK
      if (data.count >= 4) {
        console.log("❌ BLOCKED");

        return res.status(403).json({
          error: "FREE_LIMIT_REACHED"
        });
      }

      // ✅ ONLY increment on real fetch (not pre-check)
      if (!isCheckOnly) {
        await Usage.updateOne(
          { identifier: hashedId },
          { $inc: { count: 1 } }
        );

        console.log("✅ Incremented");
      } else {
        console.log("⚠️ Check only (no increment)");
      }
    }

    // ✅ Fetch story
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        error: "Story not found"
      });
    }

    res.json(story);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "SERVER_ERROR"
    });
  }
});




//app.use(express.static(path.join(__dirname, "../client/dist")));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log)

function auth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.send("Access denied ❌ No token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // store user data for later use

    next(); // allow request to proceed
  } catch (err) {
    res.send("Invalid token ❌");
  }
}




app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      error: "EMAIL_EXISTS"
    });
  }

  const newUser = new User({
    email,
    password
  });

  await newUser.save();

  res.json({ message: "User created" });
});



app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      error: "EMAIL_NOT_FOUND"
    });
  }

  if (user.password !== password) {
    return res.status(400).json({
      error: "INVALID_PASSWORD"
    });
  }

  // Success
  req.session.user = user._id;

  
  res.json({
    message: "Login successful",
    userId: user._id
  });

});



app.post("/logout", (req, res) => {
  req.session.user = null; // ✅ remove login only
  res.json({ message: "Logged out" });
});







app.get("/profile", auth, (req, res) => {
  res.send(`Welcome ${req.user.email} `);
});

app.get("/me", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      loggedIn: true
    });
  }

  res.json({ loggedIn: false });
});


// Root route
/*
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
}); 
*/

app.get("/", (req, res) => {
  res.send("Backend is running ")
})

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

