require("dotenv").config()
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const ejs = require("ejs");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const bodyParser = require('body-parser');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// connect to mongoose
const url = "mongodb+srv://note:"+process.env.PASSWORD+"@cluster0.mjmpen6.mongodb.net/safeLock";

mongoose.connect(url).then((err)=>{
  if (!err) {
    console.log(err)      
  } else {
    console.log("Connected to database successfully");
  }
});

// new post Schema
const postSchema = new mongoose.Schema({
  app: String,
  username: String,
  password:String,
  userId:String
});
postSchema.plugin(findOrCreate);

const Post = new mongoose.model("post", postSchema);

// user schema
const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema) 

// create strategy
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", (req,res)=>{
    res.render("login")
});


app.get("/register", (req,res)=>{
  res.render("register")
});

app.get("/homepage", (req,res)=>{
  if (req.isAuthenticated) {
    Post.find({userId:req.user.id}).then((foundPosts)=>{ 
        if (foundPosts) {
          res.render("body",{detailsArray:foundPosts})
        }
    })
   
  } else {
    res.redirect("/login")
  }
});

// logout from web app
app.get("/logout", (req,res)=>{
  req.logOut((err)=>{
    if(err){
      console.log(err);
    } else {
      res.redirect("/")
    }
  });
});

app.post("/details", (req,res)=>{

  const submittedPost = {
    app:req.body.app,
    username:req.body.username,
    password:req.body.password,
    userId:req.user.id
  };

  const newPost = new Post(submittedPost);
  newPost.save().then(()=>{res.redirect("/homepage")});

});

app.post("/login", (req,res)=>{
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, (err)=>{
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req,res, ()=>{
          res.redirect("/homepage")
        })
      }
    })
});


// Delete saved passwords
app.post("/delete", (req,res)=>{
  const itemId = req.body.note;
  Post.findByIdAndRemove(itemId).catch((err)=>{
    console.log(err);
  });
  res.redirect("/homepage")
});

app.post("/register", (req, res)=>{
  // collect user details and authenticate
  User.register({username:req.body.username}, req.body.password, (err,user)=>{
    if (err) {
      console.log(err);
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req,res, ()=>{
        res.redirect("/homepage")
      })
    }
  })
});

// setup listening port
app.listen(3000, ()=>{
    console.log("server started on port 3000");
});

