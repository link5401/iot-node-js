//Schema
const mongoose = require('mongoose');
const  Schema = mongoose.Schema;
const userSchema = new Schema({
  email: String,
  password: String
},{
versionKey: false
});
const tempSchema = new Schema({
  _temp: Number,
  datetime: Date 

},{
  versionKey: false
});

const humidSchema = new Schema({
  _humidity: Number,
  datetime: Date
},{
  versionKey: false
});

const toggleSchema = new Schema({
    _value: String,
    datetime: Date,
    user: String
},{
  versionKey: false
});

const soilSchema = new Schema({
    _soil: String,
    datetime: Date
},{
  versionKey: false
});
//Model
const reg =     mongoose.model('users', userSchema);
const temp =    mongoose.model('temps', tempSchema);
const humid =   mongoose.model('humids', humidSchema);
const toggle =  mongoose.model('toggles', toggleSchema);
const soil =    mongoose.model('soils',soilSchema);
module.exports = {
   reg,
   temp,
   humid,
   toggle,
   soil,   
}