const express = require('express');
const {dbcreate,update,deleted,insert} = require('./mongodb_facade')
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.listen(3000, function(){
//     console.log("server started")
// });

app.get('/', (req, res)=>{
    dbcreate()
    .then(result => res.send(result));
   
    
 });

 app.post('/', (req, res)=>{
    insert()
    .then(result => res.send(result));
    
    
 });

 app.put('/',(req,res)=>{
    update()
    .then(result => res.send(result));
   
 });

app.delete('/',(req,res)=>{
    deleted()
    .then(result => res.send(result));
   
})

module.exports = app


