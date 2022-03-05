#These url will pass to check their availability and latency
url=["www.skipq.com","www.google.com","www.facebook.com","www.youtube.com"]
'''
These metrics namespace and thresholds will be used to publish and get value from
publish metrics to generate alarms
'''

url_monitor_namespace="Hira_Aziz_Metrics"

url_merticname_availbility="url_available"
url_merticname_latency="url_latency"

latency_dimension_name='latency_dimension'
avail_dimension_name='availability_dimension'

threshold_availability = 1
threshold_latency = 0.6

''' keys for creating table
    partition key will be unique a
    sort_key to use in sorting of table
'''
table_id="Hira_aziz_Tabless"
partition_key="Hiraaziz_URLs_DB"
sort_key="timestamp"
my_email="hira.aziz.skipq@gmail.com"

# Ids for latency, availability and bucket
latency_id="hira_latency_metrics"
avail_id="hira_availability_metric"
bucket_id="hiraazizbuckets"

# These variables will be used for creating alarm for lambda working and roll back
deploy_id="Deploy_lambda_new_version"
fail_metric_namespace="AWS/Lambda"
fail_metricname="Duration"
fail_metric_threshold=12000

