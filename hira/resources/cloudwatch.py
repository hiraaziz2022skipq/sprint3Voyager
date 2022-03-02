import boto3

class CloudWatchMetrices:
    def __init__(self):
        # calling a function of cloudwatch
        self.client = boto3.client('cloudwatch')

    def putmetric(self, namespace,metric_name, dimensions, value):
        metric_call = self.client.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': metric_name,

                    'Dimensions': dimensions,       # URL and url value

                    'Value': value,         # Datapoints of url
                }
            ]
        )
        return metric_call