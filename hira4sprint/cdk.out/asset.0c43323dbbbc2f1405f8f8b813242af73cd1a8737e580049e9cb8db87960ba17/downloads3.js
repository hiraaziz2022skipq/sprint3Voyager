"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloads3 = void 0;
const { S3 } = require('aws-sdk');
class downloads3 {
    constructor() {
        this.s3bucket = new S3();
    }
    async downloadfrom_s3(bucket_Name, file) {
        let response;
        let params = {
            Bucket: bucket_Name,
            Key: file
        };
        let func = (err, data) => {
            if (err)
                console.log(err, err.stack);
            else
                response = JSON.parse(data.Body.toString('utf-8'));
        };
        await this.s3bucket.getObject(params, func).promise();
        return response;
    }
}
exports.downloads3 = downloads3;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWRzMy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRvd25sb2FkczMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUVsQyxNQUFhLFVBQVU7SUFFbkI7UUFDSSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksRUFBRSxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsV0FBZ0IsRUFBRSxJQUFZO1FBQ2hELElBQUksUUFBYSxDQUFBO1FBRWpCLElBQUksTUFBTSxHQUFHO1lBQ1QsTUFBTSxFQUFFLFdBQVc7WUFDbkIsR0FBRyxFQUFFLElBQUk7U0FDWixDQUFDO1FBRUYsSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFRLEVBQUUsSUFBUyxFQUFFLEVBQUU7WUFDL0IsSUFBSSxHQUFHO2dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7Z0JBQ2hDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFNUQsQ0FBQyxDQUFBO1FBRUQsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdEQsT0FBTyxRQUFRLENBQUE7SUFDbkIsQ0FBQztDQUNKO0FBdkJELGdDQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgUzMgfSA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBkb3dubG9hZHMzIHtcclxuICAgIHMzYnVja2V0OiBhbnlcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuczNidWNrZXQgPSBuZXcgUzMoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBkb3dubG9hZGZyb21fczMoYnVja2V0X05hbWU6IGFueSwgZmlsZTogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IHJlc3BvbnNlOiBhbnlcclxuXHJcbiAgICAgICAgbGV0IHBhcmFtcyA9IHtcclxuICAgICAgICAgICAgQnVja2V0OiBidWNrZXRfTmFtZSxcclxuICAgICAgICAgICAgS2V5OiBmaWxlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IGZ1bmMgPSAoZXJyOiBhbnksIGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSBjb25zb2xlLmxvZyhlcnIsIGVyci5zdGFjayk7IFxyXG4gICAgICAgICAgICBlbHNlIHJlc3BvbnNlID0gSlNPTi5wYXJzZShkYXRhLkJvZHkudG9TdHJpbmcoJ3V0Zi04JykpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuczNidWNrZXQuZ2V0T2JqZWN0KHBhcmFtcywgZnVuYykucHJvbWlzZSgpO1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZVxyXG4gICAgfVxyXG59Il19