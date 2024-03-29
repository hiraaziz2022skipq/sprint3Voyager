"use strict";
const axios = require('axios');
const https = require('https');
const constant = require("./constant.json");
// import {publish_metric} from './cloudwatch';
exports.webhandler = async function (event, context) {
    let values;
    // Iterate each URL
    for (var urls of constant.url) {
        var avail = await get_availability(urls);
        var latency = await get_latency(urls);
        //publishing metric
        //    let cw_avail=publish_metric(constant.url_namespace,constant.Metricname_avail,urls,avail)
        //    let cw_latency=publish_metric(constant.url_namespace,constant.Metricname_latency,urls,latency)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViSGVhbHRoTGFtYmRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2ViSGVhbHRoTGFtYmRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0IsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBRTVDLCtDQUErQztBQUMvQyxPQUFPLENBQUMsVUFBVSxHQUFHLEtBQUssV0FBVSxLQUFTLEVBQUMsT0FBVztJQUNyRCxJQUFJLE1BQVUsQ0FBQztJQUVYLG1CQUFtQjtJQUNuQixLQUFJLElBQUksSUFBSSxJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUU7UUFFM0IsSUFBSSxLQUFLLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxJQUFJLE9BQU8sR0FBRyxNQUFNLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV0QyxtQkFBbUI7UUFDdEIsOEZBQThGO1FBQzlGLG9HQUFvRztRQUM1RixNQUFNLEdBQUM7WUFDUCxLQUFLLEVBQUMsSUFBSTtZQUNWLGNBQWMsRUFBQyxLQUFLO1lBQ3BCLFNBQVMsRUFBQyxPQUFPO1NBQUMsQ0FBQztRQUUzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ2pCO0lBRUQsT0FBTyxNQUFNLENBQUE7QUFDckIsQ0FBQyxDQUFDO0FBRUosbUJBQW1CO0FBQ25CLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxHQUFVO0lBRXRDLE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUUsR0FBRyxFQUFDLEVBQUUsd0RBQXdEO1FBQzdGLE9BQU8sQ0FBQyxDQUFBO0tBQ1g7U0FDRztRQUNBLE9BQU8sQ0FBQyxDQUFBO0tBQ1g7QUFDTCxDQUFDO0FBRUQsY0FBYztBQUNkLEtBQUssVUFBVSxXQUFXLENBQUMsR0FBVTtJQUNqQyxNQUFNLFNBQVMsR0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3JDLE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxNQUFNLFFBQVEsR0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3BDLE1BQU0sSUFBSSxHQUFHLFFBQVEsR0FBQyxTQUFTLENBQUE7SUFDL0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLGtEQUFrRDtJQUMvRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3BCLE9BQU8sT0FBTyxDQUFBO0FBQ2xCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBheGlvcyA9IHJlcXVpcmUoJ2F4aW9zJyk7XHJcbmNvbnN0IGh0dHBzID0gcmVxdWlyZSgnaHR0cHMnKTtcclxuY29uc3QgY29uc3RhbnQgPSByZXF1aXJlKFwiLi9jb25zdGFudC5qc29uXCIpO1xyXG5cclxuLy8gaW1wb3J0IHtwdWJsaXNoX21ldHJpY30gZnJvbSAnLi9jbG91ZHdhdGNoJztcclxuZXhwb3J0cy53ZWJoYW5kbGVyID0gYXN5bmMgZnVuY3Rpb24oZXZlbnQ6YW55LGNvbnRleHQ6YW55KSB7XHJcbiAgICBsZXQgdmFsdWVzOmFueTtcclxuICAgIFxyXG4gICAgICAgIC8vIEl0ZXJhdGUgZWFjaCBVUkxcclxuICAgICAgICBmb3IodmFyIHVybHMgb2YgY29uc3RhbnQudXJsKSB7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgICB2YXIgYXZhaWwgPSBhd2FpdCBnZXRfYXZhaWxhYmlsaXR5KHVybHMpO1xyXG4gICAgICAgICAgIHZhciBsYXRlbmN5ID0gYXdhaXQgZ2V0X2xhdGVuY3kodXJscyk7XHJcbiAgICAgICAgICAgXHJcbiAgICAgICAgICAgLy9wdWJsaXNoaW5nIG1ldHJpY1xyXG4gICAgICAgIC8vICAgIGxldCBjd19hdmFpbD1wdWJsaXNoX21ldHJpYyhjb25zdGFudC51cmxfbmFtZXNwYWNlLGNvbnN0YW50Lk1ldHJpY25hbWVfYXZhaWwsdXJscyxhdmFpbClcclxuICAgICAgICAvLyAgICBsZXQgY3dfbGF0ZW5jeT1wdWJsaXNoX21ldHJpYyhjb25zdGFudC51cmxfbmFtZXNwYWNlLGNvbnN0YW50Lk1ldHJpY25hbWVfbGF0ZW5jeSx1cmxzLGxhdGVuY3kpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXM9e1xyXG4gICAgICAgICAgICAgICAgXCJ1cmxcIjp1cmxzLFxyXG4gICAgICAgICAgICAgICAgXCJhdmFpbGFiaWxpdHlcIjphdmFpbCxcclxuICAgICAgICAgICAgICAgIFwibGF0ZW5jeVwiOmxhdGVuY3l9O1xyXG4gICAgICAgICAgICAgICBcclxuICAgICAgICBjb25zb2xlLmxvZyh2YWx1ZXMpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB2YWx1ZXNcclxuICB9O1xyXG5cclxuLy8gR2V0IEF2YWlsYWJpbGl0eVxyXG5hc3luYyBmdW5jdGlvbiBnZXRfYXZhaWxhYmlsaXR5KHVybDpzdHJpbmcpe1xyXG5cclxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGF4aW9zLmdldCh1cmwpO1xyXG4gICAgaWYgKHJlcy5zdGF0dXM9PTIwMCB8fCByZXMuc3RhdHVzPT0yMDEpeyAvLyBJZiBzdGF0dXMgd2lsbCByZXR1cm4gMjAwICYgMjAxLCB3ZWJzaXRlIGlzIGF2YWlsYWJsZVxyXG4gICAgICAgIHJldHVybiAxXHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICAgIHJldHVybiAwXHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEdldCBMYXRlbmN5XHJcbmFzeW5jIGZ1bmN0aW9uIGdldF9sYXRlbmN5KHVybDpzdHJpbmcpe1xyXG4gICAgY29uc3Qgc3RydF90aW1lPW5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgYXhpb3MuZ2V0KHVybCk7XHJcbiAgICBjb25zdCBlbmRfdGltZT1uZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgIGNvbnN0IGRpZmYgPSBlbmRfdGltZS1zdHJ0X3RpbWVcclxuICAgIGNvbnN0IGxhdGVuY3kgPSBkaWZmIC8gMTAwMDsgLy8gQ2FsY3VsYXRpbmcgZGlmZmVyZW5jZSBiZXR3ZWVuIHN0YXJ0ICYgZW5kIHRpbWVcclxuICAgIGNvbnNvbGUubG9nKGxhdGVuY3kpXHJcbiAgICByZXR1cm4gbGF0ZW5jeVxyXG59Il19