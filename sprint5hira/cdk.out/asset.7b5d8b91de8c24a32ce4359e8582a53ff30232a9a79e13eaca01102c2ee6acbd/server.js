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
     console.log(req.url)
     console.log(req.params)
     console.log(req.once)
     console.log(req.query.url)
     
    insert(req.body)
    .then(result => res.send(result));
    
    
 });

 app.put('/',(req,res)=>{
    let newurl={"url":body.req.url}
    let oldurl = {"url":body.req.oldurl}
    update(newurl,oldurl)
    .then(result => res.send(result));
   
 });

app.delete('/',(req,res)=>{
    deleted(req.query)
    .then(result => res.send(result));
   
})

module.exports = app


