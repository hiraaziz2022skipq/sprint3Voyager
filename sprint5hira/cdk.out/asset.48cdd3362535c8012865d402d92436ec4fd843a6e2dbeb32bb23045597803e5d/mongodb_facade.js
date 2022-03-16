const { MongoClient, ServerApiVersion } = require('mongodb');



async function dbcreate(newURL){
    const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        await client.connect();
        
        const doc = await client.db('webhealth').collection('urls').find().toArray();
        
        console.log(doc)
        client.close();

        // return result;
    
}

async function update(newURL){

        const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        await client.connect();

        const update = await client.db('webhealth').collection('urls').updateOne({url : "www.youtube.com"},
        {$set: {latency : "0.8"}})

        console.log(update)
        client.close();
}


async function deleted(newRL){
    const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    await client.connect();

    const deleted = await client.db('webhealth').collection('urls').deleteOne({latency:"0.3"})

    console.log(deleted)
    client.close();
}

async function insert(){
    const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    await client.connect();

    const url_list={
        url: "www.youtube.com",
        latency: "0.7"
    }
    const result = await client.db('webhealth').collection('urls').insertOne(url_list);
    client.close();
}


module.exports.dbcreate = dbcreate
module.exports.update = update
module.exports.deleted = deleted
module.exports.insert = insert
