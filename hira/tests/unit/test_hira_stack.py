import aws_cdk as core
import aws_cdk.assertions as assertions

from hira.hira_stack import HiraStack

def test_s3bucket():
    app = core.App()
    stack = HiraStack(app, "hira")
    template = assertions.Template.from_stack(stack)    # Generating template from stack

    template.resource_count_is("AWS::S3::Bucket", 1)     # count buckets
    
def test_Lambda():
    app = core.App()
    stack = HiraStack(app, "hira")
    template = assertions.Template.from_stack(stack)    # Generating stack template

    template.resource_count_is("AWS::Lambda::Function", 3)      # count lambda function
