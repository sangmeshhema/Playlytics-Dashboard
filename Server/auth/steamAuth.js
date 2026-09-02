const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;

passport.use(
  new SteamStrategy(
    {
      returnURL: "http://localhost:5000/auth/steam/return",
      realm: "http://localhost:5000/",
      apiKey: "6A5286DCDF4362BE0E4A6C83FC9EE9AE"
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