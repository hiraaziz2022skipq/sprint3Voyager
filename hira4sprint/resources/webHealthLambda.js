"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require('axios');
const https = require('https');
const constant = require("./constant.json");
const cloudwatch_1 = require("./cloudwatch");
const { downloads3 } = require('./downloads3');
const { env } = require('process');
exports.webhandler = async function (event, context) {
    let values;
    // Download file from s3 bucket
    // const downloadS3 = new downloads3()
    // let constants = await downloadS3.downloadfrom_s3(env.bucket_name, "constant.json")
    // Iterate each URL
    for (var urls of constant.url) {
        var avail = await get_availability(urls);
        var latency = await get_latency(urls);
        //publishing metric of availability and latency
        let cw_avail = cloudwatch_1.publish_metric(constant.url_namespace, constant.Metricname_avail, urls, avail);
        let cw_latency = cloudwatch_1.publish_metric(constant.url_namespace, constant.Metricname_latency, urls, latency);
        values = {
            "url": urls,
            "availability": avail,
            "latency": latency
        };
        console.log(values);
    }
    return values;
};
// Get Availability
async function get_availability(url) {
    const res = await axios.get(url);
    if (res.status == 200 || res.status == 201) { // If status will return 200 & 201, website is available
        return 1;
    }
    else {
        return 0;
    }
}
// Get Latency
async function get_latency(url) {
    const strt_time = new Date().getTime();
    const res = await axios.get(url);
    const end_time = new Date().getTime();
    const diff = end_time - strt_time;
    const latency = diff / 1000; // Calculating difference between start & end time
    console.log(latency);
    return latency;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViSGVhbHRoTGFtYmRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2ViSGVhbHRoTGFtYmRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUM1Qyw2Q0FBNEM7QUFDNUMsTUFBTSxFQUFDLFVBQVUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUM3QyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLE9BQU8sQ0FBQyxVQUFVLEdBQUcsS0FBSyxXQUFVLEtBQVMsRUFBQyxPQUFXO0lBQ3JELElBQUksTUFBVSxDQUFDO0lBRVgsK0JBQStCO0lBQy9CLHNDQUFzQztJQUN0QyxxRkFBcUY7SUFFckYsbUJBQW1CO0lBQ25CLEtBQUksSUFBSSxJQUFJLElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRTtRQUUzQixJQUFJLEtBQUssR0FBRyxNQUFNLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLElBQUksT0FBTyxHQUFHLE1BQU0sV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXRDLCtDQUErQztRQUMvQyxJQUFJLFFBQVEsR0FBQywyQkFBYyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFDLElBQUksRUFBQyxLQUFLLENBQUMsQ0FBQTtRQUN4RixJQUFJLFVBQVUsR0FBQywyQkFBYyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFDLElBQUksRUFBQyxPQUFPLENBQUMsQ0FBQTtRQUV6RixNQUFNLEdBQUM7WUFDUCxLQUFLLEVBQUMsSUFBSTtZQUNWLGNBQWMsRUFBQyxLQUFLO1lBQ3BCLFNBQVMsRUFBQyxPQUFPO1NBQUMsQ0FBQztRQUUzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ2pCO0lBRUQsT0FBTyxNQUFNLENBQUE7QUFDckIsQ0FBQyxDQUFDO0FBRUosbUJBQW1CO0FBQ25CLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxHQUFVO0lBRXRDLE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUUsR0FBRyxFQUFDLEVBQUUsd0RBQXdEO1FBQzdGLE9BQU8sQ0FBQyxDQUFBO0tBQ1g7U0FDRztRQUNBLE9BQU8sQ0FBQyxDQUFBO0tBQ1g7QUFDTCxDQUFDO0FBRUQsY0FBYztBQUNkLEtBQUssVUFBVSxXQUFXLENBQUMsR0FBVTtJQUNqQyxNQUFNLFNBQVMsR0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3JDLE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxNQUFNLFFBQVEsR0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3BDLE1BQU0sSUFBSSxHQUFHLFFBQVEsR0FBQyxTQUFTLENBQUE7SUFDL0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLGtEQUFrRDtJQUMvRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3BCLE9BQU8sT0FBTyxDQUFBO0FBQ2xCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBheGlvcyA9IHJlcXVpcmUoJ2F4aW9zJyk7XHJcbmNvbnN0IGh0dHBzID0gcmVxdWlyZSgnaHR0cHMnKTtcclxuY29uc3QgY29uc3RhbnQgPSByZXF1aXJlKFwiLi9jb25zdGFudC5qc29uXCIpO1xyXG5pbXBvcnQge3B1Ymxpc2hfbWV0cmljfSBmcm9tICcuL2Nsb3Vkd2F0Y2gnO1xyXG5jb25zdCB7ZG93bmxvYWRzMyB9ID0gcmVxdWlyZSgnLi9kb3dubG9hZHMzJykgXHJcbmNvbnN0IHsgZW52IH0gPSByZXF1aXJlKCdwcm9jZXNzJyk7XHJcbmV4cG9ydHMud2ViaGFuZGxlciA9IGFzeW5jIGZ1bmN0aW9uKGV2ZW50OmFueSxjb250ZXh0OmFueSkge1xyXG4gICAgbGV0IHZhbHVlczphbnk7XHJcblxyXG4gICAgICAgIC8vIERvd25sb2FkIGZpbGUgZnJvbSBzMyBidWNrZXRcclxuICAgICAgICAvLyBjb25zdCBkb3dubG9hZFMzID0gbmV3IGRvd25sb2FkczMoKVxyXG4gICAgICAgIC8vIGxldCBjb25zdGFudHMgPSBhd2FpdCBkb3dubG9hZFMzLmRvd25sb2FkZnJvbV9zMyhlbnYuYnVja2V0X25hbWUsIFwiY29uc3RhbnQuanNvblwiKVxyXG5cclxuICAgICAgICAvLyBJdGVyYXRlIGVhY2ggVVJMXHJcbiAgICAgICAgZm9yKHZhciB1cmxzIG9mIGNvbnN0YW50LnVybCkge1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAgdmFyIGF2YWlsID0gYXdhaXQgZ2V0X2F2YWlsYWJpbGl0eSh1cmxzKTtcclxuICAgICAgICAgICB2YXIgbGF0ZW5jeSA9IGF3YWl0IGdldF9sYXRlbmN5KHVybHMpO1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgICAgIC8vcHVibGlzaGluZyBtZXRyaWMgb2YgYXZhaWxhYmlsaXR5IGFuZCBsYXRlbmN5XHJcbiAgICAgICAgICAgbGV0IGN3X2F2YWlsPXB1Ymxpc2hfbWV0cmljKGNvbnN0YW50LnVybF9uYW1lc3BhY2UsY29uc3RhbnQuTWV0cmljbmFtZV9hdmFpbCx1cmxzLGF2YWlsKVxyXG4gICAgICAgICAgIGxldCBjd19sYXRlbmN5PXB1Ymxpc2hfbWV0cmljKGNvbnN0YW50LnVybF9uYW1lc3BhY2UsY29uc3RhbnQuTWV0cmljbmFtZV9sYXRlbmN5LHVybHMsbGF0ZW5jeSlcclxuICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhbHVlcz17XHJcbiAgICAgICAgICAgICAgICBcInVybFwiOnVybHMsXHJcbiAgICAgICAgICAgICAgICBcImF2YWlsYWJpbGl0eVwiOmF2YWlsLFxyXG4gICAgICAgICAgICAgICAgXCJsYXRlbmN5XCI6bGF0ZW5jeX07XHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUubG9nKHZhbHVlcyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHZhbHVlc1xyXG4gIH07XHJcblxyXG4vLyBHZXQgQXZhaWxhYmlsaXR5XHJcbmFzeW5jIGZ1bmN0aW9uIGdldF9hdmFpbGFiaWxpdHkodXJsOnN0cmluZyl7XHJcblxyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgYXhpb3MuZ2V0KHVybCk7XHJcbiAgICBpZiAocmVzLnN0YXR1cz09MjAwIHx8IHJlcy5zdGF0dXM9PTIwMSl7IC8vIElmIHN0YXR1cyB3aWxsIHJldHVybiAyMDAgJiAyMDEsIHdlYnNpdGUgaXMgYXZhaWxhYmxlXHJcbiAgICAgICAgcmV0dXJuIDFcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgcmV0dXJuIDBcclxuICAgIH1cclxufVxyXG5cclxuLy8gR2V0IExhdGVuY3lcclxuYXN5bmMgZnVuY3Rpb24gZ2V0X2xhdGVuY3kodXJsOnN0cmluZyl7XHJcbiAgICBjb25zdCBzdHJ0X3RpbWU9bmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICBjb25zdCByZXMgPSBhd2FpdCBheGlvcy5nZXQodXJsKTtcclxuICAgIGNvbnN0IGVuZF90aW1lPW5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgY29uc3QgZGlmZiA9IGVuZF90aW1lLXN0cnRfdGltZVxyXG4gICAgY29uc3QgbGF0ZW5jeSA9IGRpZmYgLyAxMDAwOyAvLyBDYWxjdWxhdGluZyBkaWZmZXJlbmNlIGJldHdlZW4gc3RhcnQgJiBlbmQgdGltZVxyXG4gICAgY29uc29sZS5sb2cobGF0ZW5jeSlcclxuICAgIHJldHVybiBsYXRlbmN5XHJcbn0iXX0=