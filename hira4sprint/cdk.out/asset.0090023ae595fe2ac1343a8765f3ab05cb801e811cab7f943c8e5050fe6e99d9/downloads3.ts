const { S3 } = require('aws-sdk');

export class downloads3 {
    s3: any

    constructor() {
        this.s3 = new S3();
    }

    async downloadfrom_s3(bucket_name: any, file: string) {
        let response: any

        let params = {
            Bucket: bucket_name,
            Key: file
        };

        let func = (err: any, data: any) => {
            if (err) console.log(err, err.stack); 
            else response = JSON.parse(data.Body.toString('utf-8'));
            
        }

        await this.s3.getObject(params, func).promise();
        return response
    }
}