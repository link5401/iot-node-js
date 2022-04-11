if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const dbURI = process.env.SECRET_URI;
const fs =                require('fs');
const express =           require('express');
const morgan =            require('morgan');
const mongoose =          require('mongoose');
const { runMain } =       require('module');
const { userInfo } =      require('os');
const { Console } =       require('console');
const { append } =        require('express/lib/response');
const  path  =            require('path');
const ejs =               require('ejs');
const dotenv =            require('dotenv');
const bodyParser =        require('body-parser');
const axios =             require('axios');
const passport =          require('passport')
const methodOverride =    require('method-override')
const flash =             require('express-flash')
const session =           require('express-session')
var http =                require('http');
const moment =            require('moment-timezone');
const models =            require('./model')

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
  const today = new Date(timeElapsed)
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
 
  const temp =    models.temp
  const humid =   models.humid
  const toggle =  models.toggle
  const soil =    models.soil
  const reg =     models.reg

  //init passport
  const initializePassport = require('./passport-config');
const res = require('express/lib/response');
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

  

  broadcastInfo()
  app.get('/home', checkAuthenticated, async (req, res) => {
        res.render('index',{
          email: req.user.email
        })    
  });

  app.get('/stats',checkAuthenticated,(req,res)=>{
      res.render('stats',{
        email: req.user.email
      })
  })
 
 app.post('/home', checkAuthenticated,(req, res) =>{
     var signal = {}
     switch(req.body.toggleButton){
        case "MANUAL ON":
          signal = {
            _value: "2",
            datetime: getdate(),
            user: req.user.email
         }
          newSignal = new toggle(signal)
          newSignal.save((e)=>{ 
              console.log('added signal ' + newSignal)          
          })
          break;
        case "MANUAL OFF":
          signal = {
            _value: "3",
            datetime: getdate(),
            user: req.user.email
          }
          newSignal = new toggle(signal)
          newSignal.save((e)=>{    
            console.log('added signal ' + newSignal)       
          })
          break;
        }
      switch(req.body.autoButton){
        case "AUTO ON":
          signal = {
            _value: "2",
            datetime: getdate(),
            user: req.user.email
          }
          newSignal = new toggle(signal)
          newSignal.save((e)=>{
              console.log('added signal ' + newSignal)        
          })
          break;
        case "AUTO OFF":
          signal = {
            _value: "1",
            datetime: getdate(),
            user: req.user.email
          }
          newSignal = new toggle(signal)
          newSignal.save((e)=>{
            console.log('added signal ' + newSignal)   
          })
          break;
     }
 })

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
        res.render('register', {message: 'Email already used!'})
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

  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login')
  })

  app.post('/login', checkNotAuthenticated ,passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }))
  //DELETE method for '/logout'
  app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
  })

  async function broadcastInfo(){
    while (true){
    //queries
    const temps = await temp.find().sort([['datetime', -1]]).limit(10)
    const humids = await humid.find().sort([['datetime', -1]]).limit(10)  
    const toggles = await toggle.find().sort([['datetime', -1]]).limit(3)  
    const soils = await soil.find().sort([['datetime', -1]]).limit(10) 
                  //realtime comms
                  io.emit('info',{
                      tempsList:temps,
                      humidsList:humids,
                      togglesList:toggles,
                      soilsList:soils,
                  })
                  
           await delay(2000);
    }
  
  }
  //check for authentication
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
  server.listen(PORT,() => {
    console.log('server listening to ' + PORT)
  })
  