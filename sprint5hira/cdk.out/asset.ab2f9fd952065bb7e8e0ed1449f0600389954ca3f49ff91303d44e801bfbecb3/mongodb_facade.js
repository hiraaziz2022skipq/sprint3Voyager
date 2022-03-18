const { MongoClient, ServerApiVersion } = require('mongodb');


async function connection(){

    const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    const connect = await client.connect();
    return client;


}

async function dbcreate(newURL){
        
        client = await connection()
        const result = await client.db('webhealth').collection('urls').find().toArray();
        console.log(result)
        client.close();
        return result;
    
}

async function update(url,updatedurl){

        client = await connection()
        const result = await client.db('webhealth').collection('urls').updateOne(url,{$set: updatedurl})
        console.log(result)
        client.close();
        return result;
}


async function delete_url(data_delete){
    
    client = await connection()
    const result = await client.db('webhealth').collection('urls').deleteOne(data_delete)
    console.log(result)
    client.close();
    return result;
}

async function insert(newdata){
    
    client = await connection()
    const result = await client.db('webhealth').collection('urls').insertOne(newdata);
    console.log(result)
    client.close();
    return result;
}


module.exports.dbcreate = dbcreate
module.exports.update = update
module.exports.delete_url = delete_url
module.exports.insert = insert
