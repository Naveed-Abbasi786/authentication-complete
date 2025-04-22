// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/api/auth/google/callback",
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      // profile contains googleId, email, name, picture
      request.user = {
        googleId: profile.id,
        email: profile.email,
        name: profile.displayName,
        picture: profile.picture,
      };
      return done(null, request.user);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
