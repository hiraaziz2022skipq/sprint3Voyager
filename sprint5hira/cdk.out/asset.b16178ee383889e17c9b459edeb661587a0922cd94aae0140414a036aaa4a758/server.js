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
    res.send("Hello World");
    
 });

 app.post('/', (req, res)=>{
    insert()
    .then(result => res.send(result));
    res.send("hello");
    
 });

 app.put('/',(req,res)=>{
    update()
    .then(result => res.send(result));
    res.send("updateing")
 });

app.delete('/',(req,res)=>{
    deleted()
    .then(result => res.send(result));
    res.send("deleted")
})

module.exports = app


