import json
import os
import boto3
import constants

def lambda_handler(event, context):

    # Creating object of dynamo db
    dynamodb = boto3.client('dynamodb')


    # Converting json into python
    messages = event['Records'][0]['Sns']['Message']
    response = json.loads(messages)

    metric_name = response['Trigger']['MetricName']
    Threshold = response['NewStateReason']
    dimension=response['Trigger']['Dimensions'][0]['value']
    time_stamp = event['Records'][0]['Sns']['Timestamp']
    id=event['Records'][0]['Sns']['MessageId']

    # Enviornment variable of table
    table_name = os.environ['table_name']

    # Function Call to insert Sns logs into Dynamo DB
    dynamodb.put_item(TableName=table_name,
                      Item={
                           constants.partition_key : {'S': id},
                            'MetricName': {'S': metric_name},
                            constants.sort_key: {'S': time_stamp},
                            'NewStateReason' : {'S': Threshold},
                            'value' : {'S':dimension}
                            }
                      )