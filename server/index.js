const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer')

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



const session = require("express-session");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});


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
    const stories = await Story.find()
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
    const rawIP = req.headers["x-forwarded-for"] || req.ip;
    const ip = rawIP.split(",")[0].trim().replace("::ffff:", "");

    const userId = req.headers["x-user-id"];
    const isLoggedIn = userId && userId !== "null";

    const isCheckOnly = req.query.check === "true";

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    let remaining = null;
    let timeLeft = null;

    //  ONLY track guests
    if (!isLoggedIn) {
      const hashedId = hashIdentifier(ip);

      let data = await Usage.findOne({ identifier: hashedId });

      //  Reset window
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

      //  NOW compute remaining/timeLeft (after data exists)
      remaining = Math.max(0, 4 - data.count);
      timeLeft = ONE_DAY - (now - new Date(data.startTime).getTime());

      //  LIMIT CHECK
      if (data.count >= 4) {
        return res.status(403).json({
          error: "FREE_LIMIT_REACHED",
          remaining,
          timeLeft
        });
      }

      //  Increment only on real fetch
      if (!isCheckOnly) {
        await Usage.updateOne(
          { identifier: hashedId },
          { $inc: { count: 1 } }
        );

        //  update remaining AFTER increment
        remaining = Math.max(0, remaining - 1);
      }
    }

    //  Fetch story
    
    let story;

    if (!isCheckOnly) {
      story = await Story.findByIdAndUpdate(
        req.params.id,
        { $inc: { view_count: 1 } },
        { new: true }
      );
    } else {
      story = await Story.findById(req.params.id);
    }


    

    //  ALWAYS send remaining/timeLeft
    res.json({
      story,
      remaining,
      timeLeft
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "SERVER_ERROR"
    });
  }
});



app.get("/limit-info", async (req, res) => {
  try {
    const rawIP = req.headers["x-forwarded-for"] || req.ip;
    const ip = rawIP.split(",")[0].trim().replace("::ffff:", "");

    const userId = req.headers["x-user-id"];
    const isLoggedIn = userId && userId !== "null";

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    //Logged-in -> unlimited
    if (isLoggedIn) {
      return res.json({
        remaining: null,
        timeLeft: null
      });
    }

    const hashedId = hashIdentifier(ip);

    let data = await Usage.findOne({ identifier: hashedId });

    if (!data) {
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

    const remaining = Math.max(0, 4 - data.count);
    const timeLeft = ONE_DAY - (now - new Date(data.startTime).getTime());

    res.json({ remaining, timeLeft });

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

  
  res.json({
    message: "Login successful",
    userId: user._id
  });

});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    //Don't reveal if user exists
    if (!user) {
      return res.json({ message: "If an account exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    console.log("🚀 Forgot password route hit");

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset",
      text: `Click here to reset your password: ${resetLink}`
    });

    console.log("✅ Email sent");

    res.json({ message: "If an account exists, a reset link has been sent." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired token"
      });
    }

    // hash password (IMPORTANT)
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});




app.post("/logout", (req, res) => {
  req.session.user = null; //  remove login only
  res.json({ message: "Logged out" });
});





app.get("/profile", auth, (req, res) => {
  res.send(`Welcome ${req.user.email} `);
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

