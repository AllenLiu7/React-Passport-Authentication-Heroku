const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const UserModel = require('../models/users');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
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
            return done(err);
          }
          if (user) {
            return done(err, user, { message: 'User already exist' });
          }

          user = new UserModel({
            email,
            password,
          });
          user.save((err) => {
            if (err) {
              return done(err, false, { message: 'Fail to save user to db' });
            }
            delete user.password; //todo
            return done(null, user, { message: 'Sign up success' });
          });
        });
        // UserModel.findOne({email})
        // //Save the information provided by the user to the the database
        // const user = await UserModel.create({ email, password });
        // //Send the user information to the next middleware
        // return done(null, user);
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
          return done(null, false, { message: 'Email or Password not valid' });
        }
        //Validate password and make sure it matches with the corresponding hash stored in the database
        //If the passwords match, it returns a value of true.
        const validate = await user.isValidPassword(password);
        if (!validate) {
          return done(null, false, { message: 'Email or Password not valid' });
        }
        //Send the user information to the next middleware
        return done(null, user, { message: 'Logged in success' });
      } catch (error) {
        return done(error);
      }
    }
  )
);
