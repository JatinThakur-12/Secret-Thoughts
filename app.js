require("dotenv").config()
const express= require("express");
const bodyParser= require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const bcrypt = require('bcrypt');
const saltRounds = 10;



const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
const PORT= process.env.PORT || 3000;
//Connecting DataBase and laying its structure
mongoose.connect("mongodb://127.0.0.1:27017/userDB").then(()=>{
    console.log("Connected to database successfully");
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});



const User = mongoose.model("user", userSchema);


//ROUTING PATHS

////////////////////////// Root Route //////////////////////////////
app.get("/",function(req,res){
    res.render("home");
});

////////////////////////// Login Route /////////////////////////////
app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",function(req,res){

    const username= req.body.username;
    const password = req.body.password;

    User.findOne({email : username}).then((foundUser)=>{
        bcrypt.compare(password, foundUser.password).then(function(result) {
            if(result){
                console.log("User Found");
                res.render("secrets");
            }
            else{
                res.write("<h1>Oops Wrong password! Try Again</h1>");
                res.send();
            }
        });
        
    });

});

///////////////////////// Register Route ///////////////////////////
app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){

    bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
        // Store hash in your password DB.
        const newUser = new User({
            email : req.body.username,
            password : hash
        });
        newUser.save().then(()=>{
            console.log("Registraton Successfull");
            res.render("secrets");
        });
    });
    

});

app.listen(PORT,function(req,res){
    console.log("Server is running on "+PORT);
});