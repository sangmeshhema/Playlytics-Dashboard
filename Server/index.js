require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const { google } = require("googleapis");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const User = require("./models/User");
const Game = require("./models/Game");
const authenticateToken = require("./middleware/auth");
const app = express();
app.set("trust proxy", 1);
// =========================================================
// BASIC MIDDLEWARE
// =========================================================

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);

// =========================================================
// SESSION
// =========================================================

app.use(
  session({
    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "playlytics",
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60
    }),

    cookie: {
  secure:
    process.env.NODE_ENV === "production",

  httpOnly: true,

  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",

  maxAge:
    14 * 24 * 60 * 60 * 1000
}
  })
);

// =========================================================
// PASSPORT
// =========================================================

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// =========================================================
// YOUTUBE OAUTH
// =========================================================

const oauth2Client =
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

// =========================================================
// STEAM PASSPORT
// =========================================================

passport.use(
  new SteamStrategy(
    {
      returnURL:
        `${process.env.SERVER_URL}/auth/steam/return`,

      realm:
        `${process.env.SERVER_URL}/`,

      apiKey:
        process.env.STEAM_API_KEY
    },

    (identifier, profile, done) => {
      profile.identifier =
        identifier;

      return done(
        null,
        profile
      );
    }
  )
);


// =========================================================
// START STEAM CONNECTION - PROTECTED
// =========================================================

app.post(
  "/auth/steam/start",
  authenticateToken,
  async (req, res) => {

    try {

      // -----------------------------------------------------
      // VERIFY PLAYLYTICS USER
      // -----------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        ).select("_id");

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Playlytics user not found ❌"
          });
      }

      // -----------------------------------------------------
      // STORE USER ID IN SERVER SESSION
      // -----------------------------------------------------

      req.session.steamLinkUserId =
        user._id.toString();

      console.log("========================================");
console.log("STEAM START LINK FLOW ✅");
console.log(
  "PLAYLYTICS USER ID:",
  req.user.id
);
console.log(
  "SESSION ID:",
  req.sessionID
);
console.log(
  "STEAM LINK USER ID:",
  req.session.steamLinkUserId
);
console.log("========================================");
      // -----------------------------------------------------
      // SAVE SESSION BEFORE REDIRECT
      // -----------------------------------------------------

      await new Promise(
        (resolve, reject) => {
          req.session.save(
            (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            }
          );
        }
      );

      // -----------------------------------------------------
      // RETURN CLEAN STEAM URL
      // -----------------------------------------------------

      res.json({
        url:
          `${process.env.SERVER_URL}/auth/steam`
      });

    } catch (error) {

      console.error(
        "Steam connection start error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "Unable to start Steam connection ❌"
        });
    }
  }
);

// =========================================================
// STEAM LOGIN / CONNECT
// =========================================================

app.get(
  "/auth/steam",
  passport.authenticate("steam", {
    session: false
  })
);

// =========================================================
// GET STEAM LOGIN SESSION TOKEN
// =========================================================

app.post(
  "/auth/steam/session",
  async (req, res) => {
    try {

      const token =
        req.session.steamLoginToken;

      // No pending Steam login
      if (!token) {
        return res
          .status(401)
          .json({
            message:
              "No Steam login session found ❌"
          });
      }

      // IMPORTANT:
      // Remove token immediately after reading it
      delete req.session.steamLoginToken;

      await new Promise(
        (resolve, reject) => {
          req.session.save(
            (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            }
          );
        }
      );

      res.json({
        token
      });

    } catch (error) {

      console.error(
        "Steam session token error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "Unable to complete Steam login ❌"
        });
    }
  }
);

// =========================================================
// STEAM CALLBACK
// =========================================================

app.get(
  "/auth/steam/return",

  passport.authenticate("steam", {
    failureRedirect: `${process.env.CLIENT_URL}/`,
    session: false
  }),

  async (req, res) => {
    try {
      let user;

      // =======================================================
      // CHECK WHETHER THIS IS ACCOUNT LINKING
      // =======================================================

      const wasSteamLink =
        Boolean(req.session.steamLinkUserId);

      console.log("========================================");
      console.log(
        "CALLBACK SESSION ID:",
        req.sessionID
      );
      console.log(
        "CALLBACK SESSION DATA:",
        req.session
      );
      console.log(
        "STEAM CALLBACK RECEIVED ✅"
      );
      console.log(
        "STEAM PROFILE ID:",
        req.user?.id || "[missing]"
      );
      console.log(
        "STEAM LINK FLOW:",
        wasSteamLink
      );
      console.log(
        "STEAM LINK USER ID:",
        req.session.steamLinkUserId || "[none]"
      );
      console.log("========================================");


      // =======================================================
      // CASE 1 — LINK STEAM TO CURRENT PLAYLYTICS USER
      // =======================================================

      if (wasSteamLink) {

        const currentUserId =
          req.session.steamLinkUserId;


        // -----------------------------------------------------
        // FIND CURRENT PLAYLYTICS USER
        // -----------------------------------------------------

        user = await User.findById(
          currentUserId
        );

        if (!user) {

          delete req.session.steamLinkUserId;

          await req.session.save();

          return res
            .status(404)
            .send(
              "Playlytics user not found ❌"
            );
        }


        // -----------------------------------------------------
        // CHECK WHETHER STEAM ALREADY BELONGS TO ANOTHER USER
        // -----------------------------------------------------

        const existingSteamUser =
          await User.findOne({
            steamId: req.user.id
          });


        // =====================================================
        // STEAM BELONGS TO ANOTHER PLAYLYTICS USER
        // =====================================================

        if (
          existingSteamUser &&
          existingSteamUser._id.toString() !==
            user._id.toString()
        ) {

          const isSteamOnlyUser =
            existingSteamUser.email ===
            `steam_${req.user.id}@playlytics.com`;


          // ---------------------------------------------------
          // DO NOT TAKE OVER A REAL ACCOUNT
          // ---------------------------------------------------

          if (!isSteamOnlyUser) {

            delete req.session.steamLinkUserId;

            await req.session.save();

            return res
              .status(409)
              .send(
                "This Steam account is already linked to another Playlytics account ❌"
              );
          }


          // ---------------------------------------------------
          // MERGE STEAM-ONLY USER
          // ---------------------------------------------------

          console.log(
            "Merging Steam-only account into current Playlytics account..."
          );


          user.steamId =
            req.user.id;

          user.steamName =
            req.user.displayName;

          user.steamAvatar =
            req.user.photos?.[2]?.value || "";


          // ---------------------------------------------------
          // MOVE GAME RECORDS
          // ---------------------------------------------------

          await Game.updateMany(
            {
              userId:
                existingSteamUser._id
            },
            {
              $set: {
                userId:
                  user._id
              }
            }
          );


          // ---------------------------------------------------
          // SAVE CURRENT USER
          // ---------------------------------------------------

          await user.save();


          // ---------------------------------------------------
          // DELETE STEAM-ONLY USER
          // ---------------------------------------------------

          await User.deleteOne({
            _id:
              existingSteamUser._id
          });


          console.log(
            "Steam account merged successfully ✅"
          );

        }

        // =====================================================
        // STEAM IS FREE — LINK DIRECTLY
        // =====================================================

        else {

          user.steamId =
            req.user.id;

          user.steamName =
            req.user.displayName;

          user.steamAvatar =
            req.user.photos?.[2]?.value || "";

          await user.save();


          console.log(
            "Steam linked to current Playlytics user ✅"
          );
        }


        // -----------------------------------------------------
        // REMOVE TEMPORARY LINKING SESSION
        // -----------------------------------------------------

        delete req.session.steamLinkUserId;

      }


      // =======================================================
      // CASE 2 — NORMAL STEAM LOGIN
      // =======================================================

      else {

        user =
          await User.findOne({
            steamId:
              req.user.id
          });


        // -----------------------------------------------------
        // CREATE STEAM-ONLY USER
        // -----------------------------------------------------

        if (!user) {

          user =
            new User({

              email:
                `steam_${req.user.id}@playlytics.com`,

              password:
                "steamlogin",

              steamId:
                req.user.id,

              steamName:
                req.user.displayName,

              steamAvatar:
                req.user.photos?.[2]?.value || "",

              youtubeChannelId:
                "",

              youtubeChannelName:
                "",

              youtubeTokens:
                null
            });

          await user.save();


          console.log(
            "New Steam-only Playlytics user created ✅"
          );
        }
      }


      // =======================================================
      // CREATE PLAYLYTICS JWT
      // =======================================================

      const token =
        jwt.sign(
          {
            id:
              user._id
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "7d"
          }
        );


      // =======================================================
      // NORMAL STEAM LOGIN
      // =======================================================

      if (!wasSteamLink) {

        req.session.steamLoginToken =
          token;

        console.log(
          "Steam login token stored ✅"
        );
      }


      // =======================================================
      // SAVE SESSION
      // =======================================================

      await new Promise(
        (resolve, reject) => {

          req.session.save(
            (error) => {

              if (error) {
                reject(error);
              } else {
                resolve();
              }

            }
          );

        }
      );


      console.log(
        "Steam callback session saved ✅"
      );


      // =======================================================
      // REDIRECT TO DASHBOARD
      // =======================================================

      res.redirect(
        `${process.env.CLIENT_URL}/dashboard`
      );

    } catch (error) {

      console.error(
        "Steam login/link/merge error:",
        error
      );


      if (req.session) {

        delete req.session.steamLinkUserId;

        await new Promise(
          (resolve) => {

            req.session.save(
              () => resolve()
            );

          }
        );
      }


      res
        .status(500)
        .send(
          "Steam Login Failed ❌"
        );
    }
  }
);

// =========================================================
// GET CURRENT USER
// =========================================================

app.get("/user", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id email steamId steamName steamAvatar youtubeChannelId youtubeChannelName"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("User fetch error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
// =========================================================
// HOME
// =========================================================

app.get(
  "/",
  (req, res) => {
    res.send(
      "Playlytics API Running 🚀"
    );
  }
);

// =========================================================
// REGISTER
// =========================================================

app.post(
  "/register",
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;

      if (
        !email ||
        !password
      ) {
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

      const newUser =
        new User({
          email,
          password:
            hashedPassword
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

      res
        .status(500)
        .json(error);
    }
  }
);

// =========================================================
// LOGIN
// =========================================================

app.post(
  "/login",
  async (req, res) => {

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

      const token =
        jwt.sign(
          {
            id:
              user._id
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "7d"
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

      res
        .status(500)
        .json(error);
    }
  }
);

// =========================================================
// PROFILE
// =========================================================

app.get(
  "/profile",
    authenticateToken,
  (req, res) => {

    res.json({
      message:
        "Protected route ✅",

      userId:
        req.user.id
    });
  }
);

// =========================================================
// ADD GAME
// =========================================================

app.post(
  "/game",
    authenticateToken,
  async (req, res) => {

    try {

      const {
        game,
        hours
      } = req.body;

      const newGame =
        new Game({
          userId:
            req.user.id,

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

      res
        .status(500)
        .json(error);
    }
  }
);

// =========================================================
// GET GAMES
// =========================================================

app.get(
  "/game",
    authenticateToken,
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

      res
        .status(500)
        .json(error);
    }
  }
);

// =========================================================
// DASHBOARD API
// =========================================================

app.get(
  "/dashboard",
  authenticateToken,
  async (req, res) => {

    try {

      const games =
        await Game.find({
          userId:
            req.user.id
        });

      let totalHours =
        0;

      games.forEach(
        (game) => {
          totalHours +=
            Number(
              game.hours
            ) || 0;
        }
      );

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

      res
        .status(500)
        .json(error);
    }
  }
);

// =========================================================
// START YOUTUBE CONNECTION - PROTECTED
// =========================================================

app.post(
  "/auth/youtube/start",
  authenticateToken,
  async (req, res) => {
    try {

      // -----------------------------------------------------
      // VERIFY PLAYLYTICS USER
      // -----------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        ).select("_id");

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "Playlytics user not found ❌"
          });
      }

      // -----------------------------------------------------
      // STORE PLAYLYTICS USER IN SERVER SESSION
      // -----------------------------------------------------

      req.session.youtubeLinkUserId =
        user._id.toString();
      console.log("========================================");
      console.log("YOUTUBE START LINK FLOW ✅");
      console.log("PLAYLYTICS USER ID:", req.user.id);
      console.log("SESSION ID:", req.sessionID);
      console.log(
        "YOUTUBE LINK USER ID:",
        req.session.youtubeLinkUserId
      );
      console.log(
        "YOUTUBE OAUTH STATE CREATED ✅"
      );
      console.log("========================================");
      // -----------------------------------------------------
      // CREATE RANDOM OAUTH STATE
      // -----------------------------------------------------

      const oauthState =
        crypto.randomBytes(32).toString("hex");

      req.session.youtubeOAuthState =
        oauthState;

      // -----------------------------------------------------
      // SAVE SESSION BEFORE REDIRECT
      // -----------------------------------------------------

      await new Promise(
        (resolve, reject) => {
          req.session.save(
            (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            }
          );
        }
      );

      // -----------------------------------------------------
      // CREATE GOOGLE OAUTH URL
      // -----------------------------------------------------

      const url =
        oauth2Client.generateAuthUrl({
          access_type:
            "offline",

          prompt:
            "consent select_account",

          include_granted_scopes:
            false,

          state:
            oauthState,

          scope: [
            "https://www.googleapis.com/auth/youtube.readonly"
          ]
        });

      // -----------------------------------------------------
      // RETURN CLEAN URL
      // -----------------------------------------------------

      res.json({
        url
      });

    } catch (error) {

      console.error(
        "YouTube connection start error:",
        error
      );

      res
        .status(500)
        .json({
          message:
            "Unable to start YouTube connection ❌"
        });
    }
  }
);

// =========================================================
// YOUTUBE CALLBACK
// =========================================================

app.get(
  "/auth/youtube/callback",
  async (req, res) => {

    try {

      // -----------------------------------------------------
      // GET GOOGLE CALLBACK VALUES
      // -----------------------------------------------------

      const code =
        req.query.code;

      const state =
        req.query.state;

      if (
        !code ||
        !state
      ) {
        return res
          .status(400)
          .send(
            "Invalid YouTube callback ❌"
          );
      }

      // -----------------------------------------------------
      // DEBUG YOUTUBE CALLBACK SESSION
      // -----------------------------------------------------
      
      console.log("========================================");
      console.log("YOUTUBE CALLBACK RECEIVED ✅");
      console.log("CALLBACK SESSION ID:", req.sessionID);
      console.log(
        "CALLBACK YOUTUBE LINK USER ID:",
        req.session.youtubeLinkUserId || "[none]"
      );
      console.log(
        "CALLBACK YOUTUBE OAUTH STATE:",
        req.session.youtubeOAuthState || "[none]"
      );
      console.log(
        "GOOGLE RETURNED STATE:",
        state || "[none]"
      );
      
      const youtubeStateMatches =
        Boolean(req.session.youtubeOAuthState) &&
        req.session.youtubeOAuthState === state;
      
      console.log(
        "YOUTUBE OAUTH STATE MATCH:",
        youtubeStateMatches
      );
      console.log("========================================");
      
      // -----------------------------------------------------
      // VERIFY OAUTH STATE
      // -----------------------------------------------------
      
      if (!youtubeStateMatches) {
        return res
          .status(401)
          .send(
            "Invalid YouTube OAuth state ❌"
          );
      }

      // -----------------------------------------------------
      // GET PLAYLYTICS USER ID FROM SERVER SESSION
      // -----------------------------------------------------

      const currentUserId =
        req.session.youtubeLinkUserId;

      if (!currentUserId) {
        return res
          .status(401)
          .send(
            "Playlytics session expired ❌"
          );
      }

      // -----------------------------------------------------
      // EXCHANGE GOOGLE CODE FOR TOKENS
      // -----------------------------------------------------

      const {
        tokens
      } =
        await oauth2Client.getToken(
          code
        );

      oauth2Client.setCredentials(
        tokens
      );

      // -----------------------------------------------------
      // GET YOUTUBE CHANNEL
      // -----------------------------------------------------

      const youtube =
        google.youtube({
          version:
            "v3",

          auth:
            oauth2Client
        });

      const response =
        await youtube.channels.list({
          part:
            "snippet",

          mine:
            true
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

      const channel =
        response.data.items[0];

      // -----------------------------------------------------
      // FIND SAME PLAYLYTICS USER
      // -----------------------------------------------------

      const user =
        await User.findById(
          currentUserId
        );

      if (!user) {
        return res
          .status(404)
          .send(
            "User not found ❌"
          );
      }

      // -----------------------------------------------------
      // SAVE YOUTUBE TO SAME PLAYLYTICS USER
      // -----------------------------------------------------

      user.youtubeChannelId =
        channel.id;

      user.youtubeChannelName =
        channel.snippet.title;

      user.youtubeTokens =
        tokens;

      await user.save();

      // -----------------------------------------------------
      // REMOVE TEMPORARY YOUTUBE SESSION DATA
      // -----------------------------------------------------

      delete req.session.youtubeLinkUserId;

      delete req.session.youtubeOAuthState;

      await new Promise(
        (resolve, reject) => {
          req.session.save(
            (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            }
          );
        }
      );

      // -----------------------------------------------------
      // REDIRECT TO DASHBOARD
      // -----------------------------------------------------

      res.redirect(
        `${process.env.CLIENT_URL}/dashboard`
      );

    } catch (error) {

      console.log(
        "YouTube callback error:",
        error.response?.data ||
          error
      );

      // -----------------------------------------------------
      // CLEAN TEMPORARY SESSION DATA
      // -----------------------------------------------------

      if (req.session) {
        delete req.session.youtubeLinkUserId;
        delete req.session.youtubeOAuthState;
      
        await new Promise((resolve) => {
          req.session.save(() => resolve());
        });
      }
      
      res
        .status(500)
        .send(
          "YouTube Connection Failed ❌"
        );
    }
  }
);

// =========================================================
// YOUTUBE TOKEN REFRESH HELPER
// =========================================================

async function getValidYouTubeCredentials(user) {
  if (
    !user.youtubeTokens ||
    !user.youtubeTokens.refresh_token
  ) {
    throw new Error(
      "YouTube refresh token is missing"
    );
  }

  const tokens = user.youtubeTokens;

  oauth2Client.setCredentials(tokens);

  // Google access token expiry time
  const expiryDate = tokens.expiry_date || 0;

  // Refresh 1 minute before expiry
  const shouldRefresh =
    !tokens.access_token ||
    Date.now() >= expiryDate - 60 * 1000;

  if (!shouldRefresh) {
    return tokens;
  }

  console.log(
    "YouTube access token expired/expiring. Refreshing..."
  );

  const {
    credentials
  } = await oauth2Client.refreshAccessToken();

  // IMPORTANT:
  // Google may return a new access token without
  // returning a new refresh token.
  const updatedTokens = {
    ...tokens,
    ...credentials,
    refresh_token:
      credentials.refresh_token ||
      tokens.refresh_token
  };

  // Save the fresh credentials
  user.youtubeTokens = updatedTokens;

  await user.save();

  oauth2Client.setCredentials(
    updatedTokens
  );

  console.log(
    "YouTube access token refreshed ✅"
  );

  return updatedTokens;
}
// =========================================================
// YOUTUBE DATA - PROTECTED
// =========================================================

app.get(
  "/youtube",
  authenticateToken,
  async (req, res) => {

    try {

      // -----------------------------------------------------
      // GET CURRENT PLAYLYTICS USER
      // -----------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User not found ❌"
          });
      }

      // -----------------------------------------------------
      // CHECK YOUTUBE CONNECTION
      // -----------------------------------------------------

      if (
        !user.youtubeTokens ||
        !user.youtubeTokens.refresh_token
      ) {
        return res
          .status(400)
          .json({
            message:
              "Connect YouTube first ❌"
          });
      }

      // -----------------------------------------------------
      // GET VALID YOUTUBE CREDENTIALS
      // -----------------------------------------------------

      await getValidYouTubeCredentials(
        user
      );

      // -----------------------------------------------------
      // CREATE YOUTUBE CLIENT
      // -----------------------------------------------------

      const youtube =
        google.youtube({
          version: "v3",
          auth: oauth2Client
        });

      // -----------------------------------------------------
      // GET CHANNEL STATISTICS
      // -----------------------------------------------------

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
          .json({
            message:
              "No YouTube channel found ❌"
          });
      }

      const stats =
        response.data.items[0]
          .statistics;

      // -----------------------------------------------------
      // RETURN ONLY SAFE DATA
      // -----------------------------------------------------

      res.json({
        subscribers:
          stats.subscriberCount,

        views:
          stats.viewCount,

        videos:
          stats.videoCount
      });

    } catch (error) {

      console.error(
        "YouTube data error:",
        error.response?.data ||
          error
      );

      res
        .status(500)
        .json({
          message:
            "Error fetching YouTube data ❌"
        });
    }
  }
);

// =========================================================
// STEAM API - PROTECTED
// =========================================================

app.get(
  "/steam/:steamid",
  authenticateToken,
  async (req, res) => {

    try {

      // -----------------------------------------------------
      // GET CURRENT PLAYLYTICS USER
      // -----------------------------------------------------

      const user = await User.findById(
        req.user.id
      ).select("steamId");

      if (!user) {
        return res
          .status(404)
          .json({
            message: "User not found ❌"
          });
      }

      // -----------------------------------------------------
      // CHECK STEAM CONNECTION
      // -----------------------------------------------------

      if (!user.steamId) {
        return res
          .status(400)
          .json({
            message:
              "Steam account not connected ❌"
          });
      }

      // -----------------------------------------------------
      // VERIFY REQUESTED STEAM ID BELONGS TO USER
      // -----------------------------------------------------

      if (
        String(user.steamId) !==
        String(req.params.steamid)
      ) {
        return res
          .status(403)
          .json({
            message:
              "You are not allowed to access this Steam account ❌"
          });
      }

      // -----------------------------------------------------
      // STEAM API KEY
      // -----------------------------------------------------

      const apiKey =
        process.env.STEAM_API_KEY;

      if (!apiKey) {
        return res
          .status(500)
          .json({
            message:
              "Steam API key missing ❌"
          });
      }

      // -----------------------------------------------------
      // CALL STEAM API
      // -----------------------------------------------------

      const response =
        await axios.get(
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${user.steamId}&format=json&include_appinfo=true`
        );

      // -----------------------------------------------------
      // GET GAMES
      // -----------------------------------------------------

      const games =
        response.data.response?.games || [];

      // -----------------------------------------------------
      // SEND GAMES
      // -----------------------------------------------------

      res.json(games);

    } catch (error) {

      console.error(
        "Steam API error:",
        error.response?.data ||
          error
      );

      res
        .status(500)
        .json({
          message:
            "Steam API Error ❌"
        });
    }
  }
);
// =========================================================
// DATABASE + SERVER
// =========================================================

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
