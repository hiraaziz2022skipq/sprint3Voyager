import aws_cdk as core
import aws_cdk.assertions as assertions

from hira.hira_stack import HiraStack
# example tests. To run these tests, uncomment this file along with the example
# resource in hira/hira_stack.py
# def test_sqs_queue_created():
#     app = core.App()
#     stack = HiraStack(app, "hira")
#     template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })

def test_s3bucket():
    app = core.App()
    stack = HiraStack(app, "hira")
    template = assertions.Template.from_stack(stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    
def test_Lambda():
    app = core.App()
    stack = HiraStack(app, "hira")
    template = assertions.Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Function", 3)
