if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}


const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { runMain } = require('module');
const { userInfo } = require('os');
const { Console } = require('console');
const { append } = require('express/lib/response');
const  path  =require('path');
const ejs = require('ejs');
const dotenv = require('dotenv');
const dbURI = process.env.SECRET_URI;
const bodyParser = require('body-parser');
const axios = require('axios');
const passport = require('passport')
const methodOverride = require('method-override')
const flash = require('express-flash')
const session = require('express-session')
var http = require('http');
const app = express();
const server = http.createServer(app)
const {Server} = require('socket.io');
const delay = require('delay');
const io = new Server(server);
  io.on('connection',(socket)=>{
    console.log('user connected')
  })
function getdate(){
  const timeElapsed = Date.now();
  const today = new Date(timeElapsed);
  return today;
}


const PORT = process.env.PORT || 8080;
  mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  mongoose.connection.on('connected', () => {
      console.log('mongoose is connected!!!');
  });
  //Schema
  const  Schema = mongoose.Schema;
  const userSchema = new Schema({
    email: String,
    password: String
});
  const tempSchema = new Schema({
    _temp: Number,
    datetime: Date 

  });

  const humidSchema = new Schema({
    _humidity: Number,
    datetime: Date
  });

  const toggleSchema = new Schema({
      _value: String,
      datetime: Date
  });

  const soilSchema = new Schema({
      _soil: String,
      datetime: Date
  });
 //Model
  const reg = mongoose.model('users', userSchema);
  const temp = mongoose.model('temps', tempSchema);
  const humid = mongoose.model('humids', humidSchema);
  const toggle = mongoose.model('toggles', toggleSchema);
  const soil = mongoose.model('soils',soilSchema);
  //init passport
  const initializePassport = require('./passport-config')
  initializePassport(
    passport, 
    async(email) => {
      const userbyE = await reg.findOne({email: email})
      return userbyE;
    },
    async(id) =>{
      const userbyI = await reg.findOne({_id: id})
      return userbyI;
    }
    
  )
  app.set('view engine', 'ejs')
  app.use(express.static('public'))
  app.use('/css', express.static(__dirname + 'public/css'))
  app.use(flash())
  app.use(session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }))
  
  app.get('/home', checkAuthenticated,(req, res) => {
   
        res.render('index',{
          email: req.user.email
        })    
     // broadcastInfo()
  });
 
  app.get('/register', checkNotAuthenticated ,(req,res) => {
    res.render('register', {message: ''})
  })
  
  app.post('/register', checkNotAuthenticated, async(req,res)=>{      
      const registryInfo = {
        email: req.body.email,
        password: req.body.password
      }
      newUser = new reg(registryInfo)
      if (await reg.findOne({email: newUser.email}) != null){
        res.render('register', {message: 'email already used'})
      } else{
        newUser.save((e) => {
            if(e) {
              console.log(e)
            } else {
              console.log('Registered ' + newUser.email + ' successfully')
              res.redirect('/login')
            }
        })
      }
    } 
  )

  app.get('/login', checkNotAuthenticated,(req, res) => {
    res.render('login')
  })

  app.post('/login', checkNotAuthenticated ,passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
  })

  async function broadcastInfo(){
    while (true){
      temp.find({}, function(err,temps){
        humid.find({},function(err,humids){
            toggle.find({},function(err,toggles){
              soil.find({},function(err,soils){
                  io.emit('info',{
                      tempsList:temps,
                      humidsList:humids,
                      togglesList:toggles,
                      soilsList:soils
                  })
                  
              }).sort([['datetime', -1]])
              .limit(3)   
              }).sort([['datetime', -1]])
              .limit(3)
        }).sort([['datetime', -1]])
        .limit(3)
    })  .sort([['datetime', -1]])
        .limit(3)       
        await delay(10000)
    }
  }
  broadcastInfo()
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/home')
    }
    next()
  }
  server.listen(PORT,()=>{
    console.log('server listening to ' + PORT)
  })
  //app.listen(PORT, console.log('Server is starting at' + PORT))