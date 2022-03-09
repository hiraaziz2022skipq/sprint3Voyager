var AWS = require('aws-sdk');
export async function publish_metric(namespace:string,metricname:string,url:string,value:number){

    // Create CloudWatch service object
    var cw = new AWS.CloudWatch();

    /*
        metric_Params 
         
        MetricName -> name of metric
        Dimensions -> Key value pair
        Value -> Datapoints
    */

    var metric_Params = {
        MetricData: [
          {
            MetricName: metricname,
            Dimensions: [{ Name: "URL",    Value: url  },],
            Value: value
          },
        ],
        Namespace: namespace
      };
      
      // Putting Data into putMetricData function 
      cw.putMetricData(metric_Params, function(err:any, data:any) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", JSON.stringify(data));
        }
      });
}