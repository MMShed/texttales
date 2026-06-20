const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs"); //Switch to bcryptjs if things go downhill
const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const Usage = require("./models/Usage");

const crypto = require("crypto");

const User = require("./models/User");

const cookieParser = require("cookie-parser");

const app = express();


const cors = require("cors");

app.use(cors({
  origin: 
  [
    "http://localhost:5173",           // dev
    "https://texttales.vercel.app"      // production
  ],

  credentials: true
}));



const Story = require("./models/Story");

const cloudinary = require("cloudinary").v2;

const session = require("express-session");

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const isProd = process.env.NODE_ENV === "production";

app.set("trust proxy", 1); // required for Render / Vercel

app.use(session({
  name: "connect.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  cookie: {
    secure: isProd,                       // HTTPS only in production
    httpOnly: true,                       // protects against XSS
    sameSite: isProd ? "none" : "lax",    // cross-origin vs localhost
    maxAge: 24 * 60 * 60 * 1000          // 24 hours
  }
}));



app.use(express.json());



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
    const GUEST_LIMIT = 2

    const rawIP = req.headers["x-forwarded-for"] || req.ip;
    const ip = rawIP.split(",")[0].trim().replace("::ffff:", "");

    
    const userId = req.session.userId;
    const isLoggedIn = !!userId;


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
      if (data.count >= GUEST_LIMIT) {
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

    
if (story && story.nodes) {
  const plainStory = story.toObject();

  const updatedNodes = plainStory.nodes.map(node => {
    if (!node.imagePublicId) return node;

    let imageUrl = null;

    
    if (isLoggedIn) {
      imageUrl = cloudinary.utils.private_download_url(
        node.imagePublicId,
        node.imageFormat,
        {
          type: "upload",
          resource_type: "image",
          expires_at: Math.floor(Date.now() / 1000) + 300
        }
      );
    } else {
      imageUrl = "https://picsum.photos/800/500";
    }


    return {
      ...node,
      imageUrl
    };
  });

  story = {
    ...plainStory,
    nodes: updatedNodes
  };
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
    console.log("LIMIT SESSION:", req.session);
    console.log("SESSION USER ID:", req.session.userId);
    
    const rawIP = req.headers["x-forwarded-for"] || req.ip;
    const ip = rawIP.split(",")[0].trim().replace("::ffff:", "");

    
    const userId = req.session.userId;
    const isLoggedIn = !!userId;


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

    const remaining = Math.max(0, 2 - data.count);
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
  const { email, password, confirmPassword } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      error: "EMAIL_EXISTS"
    });
  }


  if (password !== confirmPassword) {
    return res.status(400).json({
      error: "PASSWORDS_DO_NOT_MATCH"
    });
  }


  const newUser = new User({
    email,
    password
  });

  await newUser.save();


  try {
      const msg = {
        to: email,
        from: "your-email@yourdomain.com", 
        subject: "Welcome to TextTales 🎉",

        text: `
          Welcome to TextTales!

          Your account has been created successfully.

          Start exploring:
          https://texttales.vercel.app/explore

          Stay Creepy,
          TextTales
        `,

        html: `
        <div style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#111;">
          
          <!-- HEADER -->
          <div style="background-color:black; padding:20px; text-align:center;">
            <h1 style="color:white; margin:0;">Text Tales</h1>
          </div>

          <!-- BODY -->
          <div style="background-color:#2d0b63; padding:30px; color:white;">

            <h2 style="margin-top:0;">Welcome to TextTales 🎉</h2>

            <p>Hi ${name || "there"},</p>

            <p>
              Your account has been successfully created, and you’re ready to start exploring interactive stories.
            </p>

            <p>With your account, you can:</p>

            <ul style="padding-left:20px;">
              <li>Access unlimited stories</li>
              <li>Unlock hidden images and exclusive content</li>
              <li>Continue your story progress anytime</li>
            </ul>

            <p>Click below to begin your journey:</p>

            <!-- BUTTON -->
            <a href="https://texttales.vercel.app/explore"
              style="display:inline-block; padding:12px 20px; background-color:#22c55e; color:white; text-decoration:none; border-radius:6px; font-weight:bold; margin-top:10px;">
              Start Reading
            </a>

            <br/><br/>

            <p>Your next story is waiting.</p>

            <br/>

            <hr style="border:1px solid rgba(255,255,255,0.2);" />

            <p>
              Stay Creepy,<br/>
              <strong>TextTales</strong>
            </p>

            <p style="font-size:12px; opacity:0.7; margin-top:20px;">
              You’re receiving this email because you created an account on TextTales.
            </p>

          </div>

        </div>
        `
      };

      await sgMail.send(msg);

    } catch (err) {
      console.error("SendGrid Error:", err);
    }


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

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({
      error: "INVALID_PASSWORD"
    });
  }


  req.session.userId = user._id;

  console.log("AFTER LOGIN SESSION:", req.session);

  res.json({
    message: "Login successful",
    userId: user._id
  });
});


app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If an account exists, a reset link has been sent."
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    console.log("🔗 RESET LINK:", resetLink);

    // respond immediately
    res.json({
      message: "If an account exists, a reset link has been sent."
    });

    // send email in background
    
sgMail.send({
      to: email,
      from: process.env.EMAIL, // must be verified
      subject: "Reset your TextTales password",

      //  fallback text (important for spam filtering)
      text: `Reset your password here: ${resetLink}`,

      //  YOUR STYLED EMAIL
      html: `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;">
  <tr>
    <td align="center">

      <!-- HEADER -->
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #000; text-align: center;">
        <tr>
          <td style="padding: 30px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 36px; letter-spacing: 2px;">
              Text Tales
            </h1>
          </td>
        </tr>
      </table>

      <!-- BODY -->
      <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #2a004f, #00008b); color: #ffffff;">
        <tr>
          <td style="padding: 40px;">

            <h2 style="margin-top: 0;">Password Reset Requested</h2>

            <p>
              You requested a password reset for a TextTales account associated with this email.
            </p>

            <p>
              Click the button below to continue:
            </p>

            <!-- BUTTON -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
              <tr>
                <td align="center" style="background-color: #22c55e; border-radius: 6px;">
                  <a href="${resetLink}" style="color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block; font-weight: bold;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <p>
              If you did not request a password reset, you can ignore this email completely.
            </p>

            <br/>

            <p style="margin-top: 30px;">
              Stay Creepy,<br/>
              <strong>TextTales</strong>
            </p>

          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
`
    })
    .then(() => console.log(" Email sent via SendGrid"))
    .catch(err => console.error("❌ SendGrid error:", err));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/reset-password/:token", async (req, res) => {
  console.log('reset password route hit!')

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
    //const bcrypt = require("bcrypt");
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
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("connect.sid"); // remove cookie from browser

    res.json({ message: "Logged out" });
  });
});






app.get("/profile", auth, (req, res) => {
  res.send(`Welcome ${req.user.email} `);
});


app.get("/ping", (req, res) => {
  res.status(200).send("OK");
});



app.get("/me", (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, userId: req.session.userId });
  } else {
    res.json({ loggedIn: false });
  }
});


app.get("/", (req, res) => {
  res.send("Backend is running ")
})

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

