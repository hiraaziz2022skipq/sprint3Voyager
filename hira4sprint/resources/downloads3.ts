const { S3 } = require('aws-sdk');

export class downloads3 {
    s3bucket: any
    constructor() {
        this.s3bucket = new S3();
    }

    async downloadfrom_s3(bucket_Name: any, file: string) {
        let response: any

        let params = {
            Bucket: bucket_Name,
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