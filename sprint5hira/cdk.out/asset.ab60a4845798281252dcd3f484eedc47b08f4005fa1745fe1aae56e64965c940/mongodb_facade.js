const { MongoClient, ServerApiVersion } = require('mongodb');



async function dbcreate(newURL){
    const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        await client.connect();
        
        const result = await client.db('webhealth').collection('urls').find().toArray();
        
        console.log(result)
        client.close();

        return result;
    
}

async function update(url,updatedurl){

        const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
        var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        await client.connect();

        const result = await client.db('webhealth').collection('urls').updateOne(url,{$set: updatedurl})

        console.log(result)
        client.close();
        return result;
}


async function delete_url(data_delete){
    const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    await client.connect();

    const result = await client.db('webhealth').collection('urls').deleteOne(data_delete)

    console.log(result)
    client.close();
    return result;
}

async function insert(newdata){
    const uri = "mongodb+srv://hiraaziz:hiraaziz@crud.kxkc9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    await client.connect();

    const url_list={
        url: "www.youtube.com",
        latency: "0.7"
    }
    const result = await client.db('webhealth').collection('urls').insertOne(newdata);
    console.log(result)
    client.close();
    return result;
}


module.exports.dbcreate = dbcreate
module.exports.update = update
module.exports.deleted = delete_url
module.exports.insert = insert
