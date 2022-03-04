#These url will pass to check their availability and latency
url=["www.skipq.com","www.google.com","www.facebook.com","www.youtube.com"]
url_monitor_namespace="Hira_Aziz_Metrics"

url_merticname_availbility="url_available"
url_merticname_latency="url_latency"

latency_dimension_name='latency_dimension'
avail_dimension_name='availability_dimension'

threshold_availability = 1
threshold_latency = 0.6

partition_key="Hiraaziz_URLs_DB"
sort_key="timestamp"

latency_id="hira_latency_metrics"
avail_id="hira_availability_metric"
bucket_id="hiraazizbuckets"

table_id="Hira_aziz_Tabless"
deploy_id="Deploy lambda new version"
fail_metric_namespace="AWS/Lambda"
fail_metricname="Duration"
fail_metric_threshold=12000