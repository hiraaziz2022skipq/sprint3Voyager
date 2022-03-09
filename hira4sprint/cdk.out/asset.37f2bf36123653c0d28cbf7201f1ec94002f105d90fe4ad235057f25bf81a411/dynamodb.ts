// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-west-1'});

// Create the DynamoDB service object

const { env } = require('process');
const constant = require("./constant.json");
exports.dynamohandler = async function(event:any,context:any) {

    console.log(event)
    console.log("message"+event['Records'][0]['Sns']['Message'])
    var messages = event['Records'][0]['Sns']['Message']
    var ids=event['Records'][0]['Sns']['MessageId']
    var response = JSON.parse(messages)
    console.log("response"+response)
    var metric_name = response['Trigger']['MetricName']
    var Threshold = response['NewStateReason']
    var dimension=response['Trigger']['Dimensions'][0]['value']
    var time_stamp = event['Records'][0]['Sns']['Timestamp']
    
    const unique = constant.partition_key

    var params = {
        TableName: env.table_name,
        Item: {
           unique : {S: ids},
          'MetricName': {S : metric_name},
          'NewStateReason' : {S : Threshold},
          'value' : {S : dimension}
        }
      }
      var ddb = new AWS.DynamoDB();
      return ddb.putItem(params, function(err:any, data:any) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", data);
        }
      })
      
}


