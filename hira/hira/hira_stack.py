import imp
import aws_cdk

from aws_cdk import (
    Duration,
    Stack,
    aws_iam as iam,
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_lambda as lambda_,
    aws_events as events_,
    aws_events_targets as targets_,
    aws_cloudwatch as cloudwatch,
    RemovalPolicy,
    aws_sns_subscriptions as subscriptions,
    aws_sns as sns,
    aws_cloudwatch_actions as cw_actions,
    aws_dynamodb as dynamodb,
    aws_stepfunctions_tasks as tasks,
    aws_codedeploy as codedeploy
)
from resources import constants as constants
from constructs import Construct
# url=["www.skipq.com","www.google.com","www.facebook.com","www.youtube.com"]
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

class HiraStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)


        '''S3 Bucket Code'''
        # Create a Bucket
        bucket= s3.Bucket(self, bucket_id , public_read_access=True)
        s3Bucket=bucket.bucket_name
        # upload file on s3
        self.uploadtos3(bucket)


        '''Lambda Function Code'''
        # calling web health lambda function
        lambdafunc = self.create_lambda("hiraazizlambda", "./resources", "webHealthLambda.lambda_handler",self.create_role("lambda"))
        function_name=lambdafunc.function_name

        lambdafunc.add_environment('bucket_name',str(s3Bucket))     #env var for bucktet
        lambdafunc.apply_removal_policy(RemovalPolicy.DESTROY)

        # periodically run lambda
        rule = events_.Rule(self, "rule", schedule=events_.Schedule.cron())
        rule.add_target(targets_.LambdaFunction(lambdafunc))


        '''Cloudwatch'''
        '''SNS'''
        #Creating sns topic
        my_topic = sns.Topic(self, "myTopic")
        #adding subscription email
        my_topic.add_subscription(subscriptions.EmailSubscription("hira.aziz.skipq@gmail.com"))
        # email_address = CfnParameter(self, 'subscriptionEmail')
        # my_topic.add_subscription(subscriptions.EmailSubscription(email_address.value.toString()))


        for urls in constants.url:
            dimension={"URL":urls}

            latency_alarm=self.create_alarm_latency(dimension,urls)          # Calling an alrm for latency
            avail_alarm=self.create_alarm_availbility(dimension,urls)        # Calling an alarm for availbility


            latency_alarm.add_alarm_action(cw_actions.SnsAction(my_topic))      # binding latency alarm to sns
            avail_alarm.add_alarm_action(cw_actions.SnsAction(my_topic))        # binding avail alarm to sns



        '''Dynamo DB'''
        # Creating Table

        table=self.create_table()
        table_name=table.table_name

        # Lambda function for Dynamo DB
        dynamo_lambda=self.create_lambda("hira_lambdadynamo","./resources", "dynamo.lambda_handler",self.create_role("dynamo"))
        dynamo_lambda.add_environment('table_name',str(table_name))      # Env var for Dynamo DB

        dynamo_lambda.apply_removal_policy(RemovalPolicy.DESTROY)
        
        # Giving permissions
        table.grant_read_write_data(dynamo_lambda)

        # invoke lambda after every alarm
        my_topic.add_subscription(subscriptions.LambdaSubscription(fn=dynamo_lambda))
        table.apply_removal_policy(RemovalPolicy.DESTROY)



        '''Creating Failure Metrics'''
        
        # Duration of Lambda Function Metrics and Alarms
        fail_metric=self.failure_metric(function_name)
        
        # Auto RollBack when lambda triggered
        self.roll_back(fail_metric,lambdafunc)
        
        # Invocations of Lambda Function Metrics and Alarms
        # failure_metrics_Invocations = cloudwatch.Metric(namespace="AWS/Lambda",
        #                                   metric_name="Invocations", 
        #                                     period=Duration.minutes(1),
        #                                   dimensions_map={"FunctionName":lambdafunc.function_name}
        #                                   )

        # failure_alarm_Invocations = cloudwatch.Alarm(self, "failure_alarm_invcations", metric=failure_metrics_Invocations,
        #                                evaluation_periods=1,    threshold=20,
        #                                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        #                                datapoints_to_alarm=1,
        #                                # treat_missing_data=cloudwatch.TreatMissingData.BREACHING
        #                                )
        
        



    '''Functions'''
    def create_role(self,name):
        lambda_role = iam.Role(self, "Role"+name,
                               assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
                               managed_policies=[

                                   iam.ManagedPolicy.from_aws_managed_policy_name('CloudWatchFullAccess'),
                                   iam.ManagedPolicy.from_aws_managed_policy_name('AmazonDynamoDBFullAccess'),
                                   iam.ManagedPolicy.from_aws_managed_policy_name('service-role/AWSLambdaBasicExecutionRole'),       # grants permissions to upload logs to CloudWatch
                                   iam.ManagedPolicy.from_aws_managed_policy_name('AWSLambdaInvocation-DynamoDB')
                               ])
        return lambda_role




    # Lambda function for web health
    def create_lambda(self, id, asset, handler,lambda_role):
        return lambda_.Function(self, id,
                                code=aws_cdk.aws_lambda.Code.from_asset(asset),
                                runtime=lambda_.Runtime.PYTHON_3_7,
                                handler=handler,
                                timeout=Duration.seconds(180),
                                role=lambda_role
                                )



    '''Bucket deployment func will upload all files of resource folder to s3 bucket'''

    # Function to Upload file to s3 bucket
    def uploadtos3(self, s3Bucket):
        s3deploy.BucketDeployment(self, "DeployWebsite",
                                  sources=[s3deploy.Source.asset("./resources")],
                                  destination_bucket=s3Bucket
                                  )



    '''Generating Alarm when latency and availability exceeds threshold'''
    def create_alarm_latency(self,dimension,url):
        metric_latency = cloudwatch.Metric(metric_name=url_merticname_latency,
                                           namespace=url_monitor_namespace, period=Duration.minutes(1),         # period : After how many minutes this will check datapoints in published metrics.
                                           dimensions_map=dimension
                                           )
        # Generating alarm if data points of latency exceeds threshold=0.6
        latency_alarm = cloudwatch.Alarm(self, latency_id + url, metric=metric_latency, evaluation_periods=1,           # Eva_peiord : after how many evalutaion data will be comapred to threshold
                                         threshold=threshold_latency,
                                         comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                                         datapoints_to_alarm=1,
                                         # treat_missing_data=cloudwatch.TreatMissingData.BREACHING
                                         )
        return latency_alarm



    def create_alarm_availbility(self,dimension,url):
        # Metric for availability
        metric_avails = cloudwatch.Metric(metric_name=url_merticname_availbility,
                                          namespace=url_monitor_namespace, period=Duration.minutes(1),
                                          dimensions_map=dimension
                                          )
        # Generating alarm data points of availability exceeds threshold=1
        avail_alarm = cloudwatch.Alarm(self, avail_id + url, metric=metric_avails, evaluation_periods=1,
                                       threshold=threshold_availability,
                                       comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                                       datapoints_to_alarm=1,
                                       # treat_missing_data=cloudwatch.TreatMissingData.BREACHING
                                       )
        return avail_alarm


    def create_table(self):
        table = dynamodb.Table(self, table_id,
                           partition_key=dynamodb.Attribute(name=partition_key,
                                                            type=dynamodb.AttributeType.STRING),
                           sort_key=dynamodb.Attribute(name=sort_key, type=dynamodb.AttributeType.STRING)
                           )
        return table
    
    # Failure Metrics Alarm
    
    def failure_metric(function_name):
        failure_metrics_duration = cloudwatch.Metric(namespace=fail_metric_namespace,
                                                        metric_name=fail_metricname, 
                                                        dimensions_map={"FunctionName":function_name}
                                                        )

        failure_alarm_duration = cloudwatch.Alarm( "failure_alarm_duration", metric=failure_metrics_duration,
                                        threshold=fail_metric_threshold,
                                        evaluation_periods=1,
                                        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                                        datapoints_to_alarm=1,
                                       # treat_missing_data=cloudwatch.TreatMissingData.BREACHING
                                       )
        return failure_alarm_duration
    
    # Auto Roll Back
    
    def roll_back(failure_metrics_duration,lambdafunc):
        alias = lambda_.Alias("LambdaAlias",alias_name="Current Version",version=lambdafunc.current_version)
        
        deployment_group = codedeploy.LambdaDeploymentGroup( deploy_id,
                           alias=alias, alarms=[failure_metrics_duration] )