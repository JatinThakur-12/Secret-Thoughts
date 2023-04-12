require("dotenv").config()
const express= require("express");
const bodyParser= require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");


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
    const password = md5(req.body.password);

    User.findOne({email : username}).then((foundUser)=>{
        if(foundUser.password === password){
            console.log("User Found");
            res.render("secrets");
        }
        else{
            res.write("<h1>Oops Wrong password! Try Again</h1>");
            res.send();
        }
    });

});

///////////////////////// Register Route ///////////////////////////
app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    const newUser = new User({
        email : req.body.username,
        password : md5(req.body.password)
    });

    newUser.save().then(()=>{
        console.log("Registraton Successfull");
        res.render("secrets");
    });
    

});

app.listen(PORT,function(req,res){
    console.log("Server is running on "+PORT);
});