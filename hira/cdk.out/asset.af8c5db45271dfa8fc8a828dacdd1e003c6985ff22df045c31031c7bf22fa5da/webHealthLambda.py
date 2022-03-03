import urllib3
import datetime
import constants
import s3download
from cloudwatch import CloudWatchMetrices

def lambda_handler(event, context):
    # object of cloudwatch metric
    cloudwatch = CloudWatchMetrices()

    # call download file function from file s3download
    s3download.download_file()

    # values variable to store url, avaiability and latency
    values = []

    # Reading py file(Method 1)
    url_lists = constants.url

    # reading text file(Method2)
    # f = open("constant.txt", "r")
    # url_lists=f.read().split(',')

    # iterate each url
    for url in url_lists:
        avail = get_availbility(url)
        latency = get_latency(url)

        # storing values of latency and availability of urls in dict
        values.append({'website': url, 'availbility': avail, 'latency': latency})


        '''Publishing Cloud Watch Metrics'''
        # creating dimension for each url
        Dimensions = [
            {"Name": "URL", "Value": url},
        ]

        # Calling put metric for availability
        cloudwatch.putmetric(constants.url_monitor_namespace,
                             constants.url_merticname_availbility,
                             Dimensions,
                             avail)
        # Calling put metric for latency
        cloudwatch.putmetric(constants.url_monitor_namespace,
                             constants.url_merticname_latency,
                             Dimensions,
                             latency)

    return values



#check availability
def get_availbility(url):
    http = urllib3.PoolManager()
    response = http.request("GET", url)
    if response == 200 or 201:
        return 1.0
    else:
        return 0.0


#check latency
def get_latency(url):
    http = urllib3.PoolManager()
    startTime = datetime.datetime.now()
    response = http.request("GET", url)
    endTime = datetime.datetime.now()
    diff = startTime - endTime
    latency = round(diff.microseconds * 0.000001, 6)
    return latency