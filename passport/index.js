const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const UserModel = require('../models/users');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  UserModel.findById(id, function (err, user) {
    done(err, user);
  });
});

//Create a passport middleware to handle user registration
passport.use(
  'signup',
  new localStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        await UserModel.findOne({ email }, (err, user) => {
          if (err) {
            return done(err, null);
          }
          if (user) {
            return done('User already exist', null);
          }

          user = new UserModel({
            email,
            password,
          });
          user.save((err, user) => {
            if (err) {
              return done(err, null);
            }
            //delete user.password; //todo
            return done(null, user, { message: 'sign up seccess' });
          });
        });
      } catch (error) {
        done(error);
      }
    }
  )
);

//Create a passport middleware to handle User login
passport.use(
  'login',
  new localStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        //Find the user associated with the email provided by the user
        const user = await UserModel.findOne({ email });
        if (!user) {
          //If the user isn't found in the database, return a message
          return done('Email or Password not valid', false);
        }
        //Validate password and make sure it matches with the corresponding hash stored in the database
        //If the passwords match, it returns a value of true.
        const validate = await user.isValidPassword(password);
        if (!validate) {
          return done('Email or Password not valid', false);
        }
        //Send the user information to the next middleware
        return done(null, user, { message: 'Logged in success' });
      } catch (error) {
        return done(error);
      }
    }
  )
);

//google OAuth strategy
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/oauth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const currentUser = await UserModel.findOne({
          googleId: profile.id,
        });
        // create new user if the database doesn't have this user
        if (!currentUser) {
          const newUser = await new UserModel({
            googleId: profile.id,
            email: profile._json.email,
          }).save();
          if (newUser) {
            done(null, newUser);
          }
        }
        done(null, currentUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

//facebook oauth
passport.use(
  'facebook',
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: '/oauth/facebook/callback',
      profileFields: ['email', 'name', 'id'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const currentUser = await UserModel.findOne({
          facebookId: profile.id,
        });
        // create new user if the database doesn't have this user
        if (!currentUser) {
          const newUser = await new UserModel({
            facebookId: profile.id,
            email: profile._json.last_name,
          }).save();
          if (newUser) {
            done(null, newUser);
          }
        }
        done(null, currentUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);
