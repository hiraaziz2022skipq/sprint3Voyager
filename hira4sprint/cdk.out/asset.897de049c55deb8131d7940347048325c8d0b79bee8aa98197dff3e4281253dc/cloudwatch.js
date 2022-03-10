"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publish_metric = void 0;
var AWS = require('aws-sdk');
async function publish_metric(namespace, metricname, url, value) {
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
                Dimensions: [{ Name: "URL", Value: url },],
                Value: value
            },
        ],
        Namespace: namespace
    };
    // Putting Data into putMetricData function 
    cw.putMetricData(metric_Params, function (err, data) {
        if (err) {
            console.log("Error", err);
        }
        else {
            console.log("Success", JSON.stringify(data));
        }
    });
}
exports.publish_metric = publish_metric;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWR3YXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsb3Vkd2F0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3RCLEtBQUssVUFBVSxjQUFjLENBQUMsU0FBZ0IsRUFBQyxVQUFpQixFQUFDLEdBQVUsRUFBQyxLQUFZO0lBRTNGLG1DQUFtQztJQUNuQyxJQUFJLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUU5Qjs7Ozs7O01BTUU7SUFFRixJQUFJLGFBQWEsR0FBRztRQUNoQixVQUFVLEVBQUU7WUFDVjtnQkFDRSxVQUFVLEVBQUUsVUFBVTtnQkFDdEIsVUFBVSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFLLEtBQUssRUFBRSxHQUFHLEVBQUcsRUFBRTtnQkFDOUMsS0FBSyxFQUFFLEtBQUs7YUFDYjtTQUNGO1FBQ0QsU0FBUyxFQUFFLFNBQVM7S0FDckIsQ0FBQztJQUVGLDRDQUE0QztJQUM1QyxFQUFFLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxVQUFTLEdBQU8sRUFBRSxJQUFRO1FBQ3hELElBQUksR0FBRyxFQUFFO1lBQ1AsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDM0I7YUFBTTtZQUNMLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUM5QztJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ1QsQ0FBQztBQWhDRCx3Q0FnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgQVdTID0gcmVxdWlyZSgnYXdzLXNkaycpO1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHVibGlzaF9tZXRyaWMobmFtZXNwYWNlOnN0cmluZyxtZXRyaWNuYW1lOnN0cmluZyx1cmw6c3RyaW5nLHZhbHVlOm51bWJlcil7XHJcblxyXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggc2VydmljZSBvYmplY3RcclxuICAgIHZhciBjdyA9IG5ldyBBV1MuQ2xvdWRXYXRjaCgpO1xyXG5cclxuICAgIC8qXHJcbiAgICAgICAgbWV0cmljX1BhcmFtcyBcclxuICAgICAgICAgXHJcbiAgICAgICAgTWV0cmljTmFtZSAtPiBuYW1lIG9mIG1ldHJpY1xyXG4gICAgICAgIERpbWVuc2lvbnMgLT4gS2V5IHZhbHVlIHBhaXJcclxuICAgICAgICBWYWx1ZSAtPiBEYXRhcG9pbnRzXHJcbiAgICAqL1xyXG5cclxuICAgIHZhciBtZXRyaWNfUGFyYW1zID0ge1xyXG4gICAgICAgIE1ldHJpY0RhdGE6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgTWV0cmljTmFtZTogbWV0cmljbmFtZSxcclxuICAgICAgICAgICAgRGltZW5zaW9uczogW3sgTmFtZTogXCJVUkxcIiwgICAgVmFsdWU6IHVybCAgfSxdLFxyXG4gICAgICAgICAgICBWYWx1ZTogdmFsdWVcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBOYW1lc3BhY2U6IG5hbWVzcGFjZVxyXG4gICAgICB9O1xyXG4gICAgICBcclxuICAgICAgLy8gUHV0dGluZyBEYXRhIGludG8gcHV0TWV0cmljRGF0YSBmdW5jdGlvbiBcclxuICAgICAgY3cucHV0TWV0cmljRGF0YShtZXRyaWNfUGFyYW1zLCBmdW5jdGlvbihlcnI6YW55LCBkYXRhOmFueSkge1xyXG4gICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3JcIiwgZXJyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJTdWNjZXNzXCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG59Il19