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
function getdate(){
  const timeElapsed = Date.now();
  const today = new Date(timeElapsed);
  return today;
}

const app = express();
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
 //Model
  const temp = mongoose.model('temps', tempSchema);
  const humid = mongoose.model('humids', humidSchema);
  const toggle = mongoose.model('toggles', toggleSchema);
  // const data = {
  //   _temp: 33,
  // };
  
  // const newTemp = new temp(data);

  // //saving
  // newTemp.save((error) => {
  //   if(error){
  //     console.log('error!');
  //   } else {
  //     console.log('saved!');
  //   }
  // });
  //http req
  //app.use(express.json());
  app.set('view engine', 'ejs')
  app.use(express.static('public'))
  app.use('/css', express.static(__dirname + 'public/css'))
  app.get('/home', (req, res) => {
      temp.find({}, function(err,temps){
          humid.find({},function(err,humids){
              toggle.find({},function(err,toggles){
                res.render('index',{tempsList:temps, humidsList:humids, togglesList: toggles});
                })
                .sort('datetime')
                .limit(3)
          })
          .sort('datetime')
          .limit(3)
      })         
      .sort('datetime')
      .limit(3)
  });
  app.get('/login', (req, res) => {
      res.render('login');
  }); 
  app.listen(PORT, console.log('Server is starting at' ))