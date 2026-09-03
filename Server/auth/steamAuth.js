const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;

passport.use(
  new SteamStrategy(
    {
      returnURL: `${process.env.SERVER_URL}/auth/steam/return`,
realm: `${process.env.SERVER_URL}/`,
      apiKey: process.env.STEAM_API_KEY,
    },

    function(identifier, profile, done) {
      profile.identifier = identifier;
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});