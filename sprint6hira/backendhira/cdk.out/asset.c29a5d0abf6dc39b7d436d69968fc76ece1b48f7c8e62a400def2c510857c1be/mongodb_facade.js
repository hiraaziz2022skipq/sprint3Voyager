const { MongoClient, ServerApiVersion } = require('mongodb');

// function to connect to database
async function connection(){

    const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";       // url to connect to database
    var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); // Creating object of MongoDB client
    const connect = await client.connect();                                                                                 // Establishing connection to mongo DB
    return client;


}

// Get all documents from database
async function dbcreate(newURL){
        
        client = await connection()
        const result = await client.db('webhealth').collection('urls').find().toArray();                                    // query to get all documents from database
        console.log(result)
        client.close();
        return result;
    
}

// function to update url from database
async function update(url,updatedurl){

        client = await connection()
        const result = await client.db('webhealth').collection('urls').updateOne(url,{$set: updatedurl})                     // Query to update url from database
        console.log(result)
        client.close();
        return result;
}

// function to delete url from database
async function delete_url(data_delete){
    
    client = await connection()
    const result = await client.db('webhealth').collection('urls').deleteOne(data_delete)                                     // Query to delete url from database
    console.log(result)
    client.close();
    return result;
}

// function to insert url 
async function insert(newdata){
    
    client = await connection()
    const ans = await client.db('webhealth').collection('urls').countDocuments(newdata)
    console.log("ans is ",ans)
    
    if (ans>0){
        result="data can not be inserted"
        return result
    }
    else{
        const result = await client.db('webhealth').collection('urls').insertOne(newdata);                                         // Query to insert url into database
        console.log(result)
        client.close();
        return result;
        
    }
    
    
}


module.exports.dbcreate = dbcreate
module.exports.update = update
module.exports.delete_url = delete_url
module.exports.insert = insert