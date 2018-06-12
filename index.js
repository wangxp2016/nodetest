var express = require('express')   
  , http = require('http')  
  , path = require('path')
  ,bodyParser=require("body-parser");  
  
// need it...  
var app = express(); 
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials','true');
    next();
};
app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());
  
 

var todo = require('./src/operate');
var user = require('./src/user')

app.post('/login', user.login);  

app.get('/json', todo.list);  
app.delete('/json', todo.delete);  
app.post('/json', todo.add);  
app.put('/json', todo.update);  

http.createServer(app).listen(3000, function(){  
  console.log('Express server listening on port ');  
});  