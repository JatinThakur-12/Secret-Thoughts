require("dotenv").config()
const express= require("express");
const bodyParser= require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
const PORT= process.env.PORT || 3000;

//Basic steps for express-session 
app.use(session({
    secret: process.env.SECRET, // secert=> can contain any string value 
    resave: false,
    saveUninitialized: true    
}));

//setting up passport 
app.use(passport.initialize());
app.use(passport.session());


//Connecting DataBase and laying its structure
mongoose.connect("mongodb://127.0.0.1:27017/userDB").then(()=>{
    console.log("Connected to database successfully");
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose); 
userSchema.plugin(findOrCreate);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//ROUTING PATHS

////////////////////////// Root Route //////////////////////////////
app.get("/",function(req,res){
    res.render("home");
});

///////////////////////// Auth Google Route ////////////////////////
app.get("/auth/google",
    passport.authenticate("google", { scope: ['profile'] })
);
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});
////////////////////////// Login Route /////////////////////////////
app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) { 
            return next(err); 
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
   
});

///////////////////////// Register Route ///////////////////////////
app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        }else {
            passport.authenticate("local")(req,res,function(){//important line
                res.redirect("/secrets");
            });
        }
    });
});

//////////////////////// SECRET ROUTE ////////////////////////////////

app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}}).then(function(foundSecrets){
        res.render("secrets",{usersWithSecrets: foundSecrets});
    });
});


/////////////////////// SUBMIT SECRET /////////////////////////////////

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});
app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    User.updateOne({id : req.user.id }, {"$set": { secret : submittedSecret}}).then(()=>{
        res.redirect("/secrets");
    });
    // User.findById(req.user.id).then((foundUser)=>{
    //     foundUser.secret = submittedSecret;
    //     foundUser.save().then(()=>{
    //         res.redirect("/secrets");
    //     });
    // });
});

//////////////////////// Logout Route //////////////////////////////////

app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

app.listen(PORT,function(req,res){
    console.log("Server is running on "+PORT);
});