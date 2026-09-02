require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { google } = require("googleapis");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;

const User = require("./models/User");
const Game = require("./models/Game");
const auth = require("./middleware/auth");

const app = express();

// ================= BASIC MIDDLEWARE =================

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);

// ================= SESSION =================

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// ================= YOUTUBE OAUTH =================

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ================= STEAM PASSPORT =================

passport.use(
  new SteamStrategy(
    {
      returnURL: `${process.env.SERVER_URL}/auth/steam/return`,
      realm: `${process.env.SERVER_URL}/`,
      apiKey: process.env.STEAM_API_KEY
    },
    (identifier, profile, done) => {
      profile.identifier = identifier;
      return done(null, profile);
    }
  )
);

// ================= STEAM LOGIN =================

app.get(
  "/auth/steam",
  passport.authenticate("steam")
);

// ================= STEAM CALLBACK =================

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", {
    failureRedirect: `${process.env.CLIENT_URL}/login`
  }),
  async (req, res) => {
    try {
      // CHECK IF STEAM USER EXISTS
      let user = await User.findOne({
        steamId: req.user.id
      });

      // CREATE NEW USER IF NOT EXISTS
      if (!user) {
        user = new User({
          email: `steam_${req.user.id}@playlytics.com`,
          password: "steamlogin",
          steamId: req.user.id,
          steamName: req.user.displayName,
          steamAvatar: req.user.photos?.[2]?.value || "",
          youtubeChannelId: "",
          youtubeChannelName: "",
          youtubeTokens: null
        });

        await user.save();
      }

      // CREATE JWT TOKEN
      const token = jwt.sign(
        {
          id: user._id
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      // REDIRECT TO DASHBOARD
      res.redirect(
        `${process.env.CLIENT_URL}/dashboard?token=${token}`
      );
    } catch (error) {
      console.log("Steam login error:", error);

      res.status(500).send(
        "Steam Login Failed ❌"
      );
    }
  }
);

// ================= GET CURRENT USER =================

app.get("/user", auth, async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);
  } catch (error) {
    console.log("User route error:", error);

    res.status(500).json({
      error: "Server Error"
    });
  }
});

// ================= HOME =================

app.get("/", (req, res) => {
  res.send(
    "Playlytics API Running 🚀"
  );
});

// ================= REGISTER =================

app.post("/register", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json(
          "All fields required ❌"
        );
    }

    const existingUser =
      await User.findOne({
        email
      });

    if (existingUser) {
      return res
        .status(400)
        .json(
          "User already exists ❌"
        );
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const newUser = new User({
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.json(
      "User registered successfully ✅"
    );
  } catch (error) {
    console.log(
      "Register error:",
      error
    );

    res.status(500).json(error);
  }
});

// ================= LOGIN =================

app.post("/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const user =
      await User.findOne({
        email
      });

    if (!user) {
      return res
        .status(404)
        .json(
          "User not found ❌"
        );
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res
        .status(400)
        .json(
          "Wrong password ❌"
        );
    }

    const token = jwt.sign(
      {
        id: user._id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message:
        "Login successful ✅",
      token
    });
  } catch (error) {
    console.log(
      "Login error:",
      error
    );

    res.status(500).json(error);
  }
});

// ================= PROFILE =================

app.get(
  "/profile",
  auth,
  (req, res) => {
    res.json({
      message:
        "Protected route ✅",
      userId: req.user.id
    });
  }
);

// ================= ADD GAME =================

app.post(
  "/game",
  auth,
  async (req, res) => {
    try {
      const {
        game,
        hours
      } = req.body;

      const newGame = new Game({
        userId: req.user.id,
        game,
        hours
      });

      await newGame.save();

      res.json(
        "Game added successfully ✅"
      );
    } catch (error) {
      console.log(
        "Add game error:",
        error
      );

      res.status(500).json(error);
    }
  }
);

// ================= GET GAMES =================

app.get(
  "/game",
  auth,
  async (req, res) => {
    try {
      const games =
        await Game.find({
          userId:
            req.user.id
        });

      res.json(games);
    } catch (error) {
      console.log(
        "Get games error:",
        error
      );

      res.status(500).json(error);
    }
  }
);

// ================= DASHBOARD =================

app.get(
  "/dashboard",
  auth,
  async (req, res) => {
    try {
      const games =
        await Game.find({
          userId:
            req.user.id
        });

      let totalHours = 0;

      games.forEach((game) => {
        totalHours +=
          Number(game.hours) || 0;
      });

      res.json({
        totalGames:
          games.length,
        totalHours
      });
    } catch (error) {
      console.log(
        "Dashboard error:",
        error
      );

      res.status(500).json(error);
    }
  }
);

// ================= YOUTUBE LOGIN =================

app.get(
  "/auth/youtube",
  (req, res) => {
    try {
      const token =
        req.query.token;

      if (!token) {
        return res.send(
          "No token, access denied ❌"
        );
      }

      const url =
        oauth2Client.generateAuthUrl(
          {
            access_type:
              "offline",

            prompt:
              "consent select_account",

            include_granted_scopes:
              false,

            state: token,

            scope: [
              "https://www.googleapis.com/auth/youtube.readonly"
            ]
          }
        );

      res.redirect(url);
    } catch (error) {
      console.log(
        "YouTube login error:",
        error
      );

      res.status(500).send(
        "YouTube Login Failed ❌"
      );
    }
  }
);

// ================= YOUTUBE CALLBACK =================

app.get(
  "/auth/youtube/callback",
  async (req, res) => {
    try {
      const code =
        req.query.code;

      const token =
        req.query.state;

      if (!code || !token) {
        return res
          .status(400)
          .send(
            "Invalid YouTube callback ❌"
          );
      }

      const {
        tokens
      } =
        await oauth2Client.getToken(
          code
        );

      oauth2Client.setCredentials(
        tokens
      );

      const youtube =
        google.youtube({
          version: "v3",
          auth: oauth2Client
        });

      const response =
        await youtube.channels.list({
          part: "snippet",
          mine: true
        });

      if (
        !response.data.items ||
        !response.data.items.length
      ) {
        return res.send(
          "No YouTube channel found ❌"
        );
      }

      const channel =
        response.data.items[0];

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      const user =
        await User.findById(
          decoded.id
        );

      if (!user) {
        return res
          .status(404)
          .send(
            "User not found ❌"
          );
      }

      user.youtubeChannelId =
        channel.id;

      user.youtubeChannelName =
        channel.snippet.title;

      user.youtubeTokens =
        tokens;

      await user.save();

      global.youtubeAuth =
        oauth2Client;

      res.redirect(
        `${process.env.CLIENT_URL}/dashboard?token=${token}`
      );
    } catch (error) {
      console.log(
        "YouTube callback error:",
        error.response?.data ||
          error
      );

      res.status(500).send(
        "YouTube Connection Failed ❌"
      );
    }
  }
);

// ================= YOUTUBE DATA =================

app.get(
  "/youtube",
  async (req, res) => {
    try {
      const token =
        req.headers.authorization?.split(
          " "
        )[1];

      if (!token) {
        return res
          .status(401)
          .send(
            "No token ❌"
          );
      }

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      const user =
        await User.findById(
          decoded.id
        );

      if (
        !user ||
        !user.youtubeTokens
      ) {
        return res
          .status(400)
          .send(
            "Login with YouTube first ❌"
          );
      }

      oauth2Client.setCredentials(
        user.youtubeTokens
      );

      const youtube =
        google.youtube({
          version: "v3",
          auth: oauth2Client
        });

      const response =
        await youtube.channels.list({
          part: "statistics",
          mine: true
        });

      if (
        !response.data.items ||
        !response.data.items.length
      ) {
        return res
          .status(400)
          .send(
            "No YouTube channel found ❌"
          );
      }

      const stats =
        response.data.items[0]
          .statistics;

      res.json({
        subscribers:
          stats.subscriberCount,

        views:
          stats.viewCount,

        videos:
          stats.videoCount
      });
    } catch (error) {
      console.log(
        "YouTube data error:",
        error.response?.data ||
          error
      );

      res.status(500).send(
        "Error fetching YouTube data ❌"
      );
    }
  }
);

// ================= STEAM API =================

app.get(
  "/steam/:steamid",
  async (req, res) => {
    try {
      const steamid =
        req.params.steamid;

      const apiKey =
        process.env.STEAM_API_KEY;

      const response =
        await axios.get(
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamid}&format=json&include_appinfo=true`
        );

      const games =
        response.data.response
          .games || [];

      res.json(games);
    } catch (error) {
      console.log(
        "Steam API error:",
        error.response?.data ||
          error
      );

      res.status(500).send(
        "Steam API Error ❌"
      );
    }
  }
);

// ================= DATABASE + SERVER =================

mongoose
  .connect(
    process.env.MONGO_URI,
    {
      dbName:
        "playlytics"
    }
  )
  .then(() => {
    console.log(
      "MongoDB Connected ✅"
    );

    const PORT =
      process.env.PORT || 5000;

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `Server running on port ${PORT}`
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      "MongoDB connection failed:",
      err
    );

    process.exit(1);
  });