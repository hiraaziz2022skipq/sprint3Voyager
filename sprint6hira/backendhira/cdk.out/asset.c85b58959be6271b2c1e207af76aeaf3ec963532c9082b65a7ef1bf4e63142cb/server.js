const express = require('express');
const {dbcreate,update,delete_url,insert} = require('./mongodb_facade')
const bodyParser = require('body-parser');

const app = express();                               // Creating object of express.js

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Get all the documents from mongdb
app.get('/', (req, res)=>{

     dbcreate()                                         // Calling function get data function
    .then(result => res.send(result));
    
 });

// Insert value into mongodb
 app.post('/', (req, res)=>{
    
    insert(req.body)                                    // Calling insert into mongodb function
    .then(result => res.send(result));
     
 });

// Update value in mongodb
 app.put('/',(req,res)=>{

    let updatedurl={"url":req.body.updateurl}           // Getting updated url
    let url = {"url":req.body.url}                      // Getting url to update
    update(url,updatedurl)                              // Calling update function
    .then(result => res.send(result));
   
 });

// Delete url from mongodb
app.delete('/',(req,res)=>{

    let deleted_url={"url":req.body.url}                // Getting url to delete from mongodb
    delete_url(deleted_url)                             // Calling delete function
    .then(result => res.send(result));
   
})

module.exports = app