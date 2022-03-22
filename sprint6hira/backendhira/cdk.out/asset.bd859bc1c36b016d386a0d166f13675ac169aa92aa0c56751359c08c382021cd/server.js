const express = require('express');
const {dbcreate,update,delete_url,insert} = require('./mongodb_facade')
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();                               // Creating object of express.js
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = 3000

app.listen(port, () => {console.log('http://localhost:'+port)})
// Get all the documents from mongdb
app.get('/', (req, res)=>{

     dbcreate()                                         // Calling function get data function
    .then(result => res.send(result));
    
 });

// Insert value into mongodb
 app.post('/', (req, res)=>{
    const url_value = req.body.urls
    const value_insert = { "url":url_value}
    insert(value_insert)                                    // Calling insert into mongodb function
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