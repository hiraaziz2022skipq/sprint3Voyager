const { S3 } = require('aws-sdk');

export class S3Bucket {
    s3bucket: any

    constructor() {
        this.s3bucket = new S3();
    }

    async downloadfrom_s3(bucketName: any, file: string) {
        let response: any

        let params = {
            Bucket: bucketName,
            Key: file
        };

        let func = (err: any, data: any) => {
            if (err) console.log(err, err.stack); 
            else response = JSON.parse(data.Body.toString('utf-8'));
            
        }

        await this.s3bucket.getObject(params, func).promise();
        return response
    }
}