const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");

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


app.get("/can-view-story", (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.json({ allowed: true });
    }

    const rawIP = req.headers["x-forwarded-for"] || req.ip;
    const ip = rawIP.split(",")[0].trim().replace("::ffff:", "");

    const id = req.session?.user || ip;
        

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const data = freeUserLimits.get(id);

    if (!data || now - data.startTime > ONE_DAY) {
      return res.json({ allowed: true });
    }

    if (data.count >= 4) {
      return res.status(403).json({
        error: "FREE_LIMIT_REACHED"
      });
    }

    return res.json({ allowed: true });

  } catch (err) {
    console.error("Error in /can-view-story:", err);

    return res.status(500).json({
      error: "SERVER_ERROR"
    });
  }
});

app.get("/stories", async (req, res) => {
  try {
    const stories = await Story.find({ ready: true })
    res.json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching stories ❌");
  }
});


app.get("/stories/:id", async (req, res) => {
  try {
    const rawIP = req.headers["x-forwarded-for"] || req.ip;
    const ip = rawIP.split(",")[0].trim().replace("::ffff:", "");
    const id = req.session?.user || ip;

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    let data = freeUserLimits.get(id);

    // ✅ Reset if new or expired
    if (!data || now - data.startTime > ONE_DAY) {
      data = {
        count: 0,
        startTime: now
      };
    }

    // ✅ Only apply limit for guests
    if (!req.session || !req.session.user) {
      
      console.log({
  sessionID: req.sessionID,
  isLoggedIn: req.session?.user,
  currentCount: data?.count
});
      
      if (data.count >= 4) {
        return res.status(403).json({
          error: "FREE_LIMIT_REACHED"
        });
      }

      data.count += 1;
    }

    freeUserLimits.set(id, data);

    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        error: "Story not found"
      });
    }

    res.json(story);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
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

  res.json({ message: "Login successful" });
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

