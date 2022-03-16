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
    res.send("Hello World");
    
 });

 app.post('/', (req, res)=>{
    insert()
    res.send("hello");
    
 });

 app.put('/',(req,res)=>{
    update()
    res.send("updateing")
 });

app.delete('/',(req,res)=>{
    deleted()
    res.send("deleted")
})

module.exports = app


