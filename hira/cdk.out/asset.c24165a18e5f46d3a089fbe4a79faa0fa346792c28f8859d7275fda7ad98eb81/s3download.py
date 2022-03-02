import boto3
import sys
import os


#Creating Session
def s3_session():
    s3_client = boto3.client('s3')
    return s3_client

bucket_names3=os.environ["bucket_name"]
bucket_name=bucket_names3
file_name= 'constants.py'
path='/tmp/constants.py'

'''This function will first create a session and then download file from s3 bucket'''

#Download File
def download_file():
    s3_client=s3_session()
    s3_client.download_file(bucket_name,file_name,path)
    sys.path.insert(1, '/tmp/')