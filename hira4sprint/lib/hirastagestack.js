"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hirastagestack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const hira4sprint_stack_1 = require("./hira4sprint-stack");
const cdk = require("aws-cdk-lib");
const app = new cdk.App();
class Hirastagestack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        new hira4sprint_stack_1.Hira4SprintStack(this, "HiraStack");
    }
}
exports.Hirastagestack = Hirastagestack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYXN0YWdlc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhc3RhZ2VzdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBK0M7QUFHL0MsMkRBQW9EO0FBQ3BELG1DQUFtQztBQUVuQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixNQUFhLGNBQWUsU0FBUSxtQkFBSztJQUNyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JCLElBQUksb0NBQWdCLENBQUMsSUFBSSxFQUFDLFdBQVcsQ0FBQyxDQUFBO0lBQzNDLENBQUM7Q0FDSjtBQUxELHdDQUtDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU3RhY2ssIFN0YWNrUHJvcHN9IGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHtIaXJhNFNwcmludFN0YWNrfSBmcm9tICcuL2hpcmE0c3ByaW50LXN0YWNrJ1xyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5cclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBIaXJhc3RhZ2VzdGFjayBleHRlbmRzIFN0YWNrIHtcclxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xyXG4gICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuICAgICAgICAgbmV3IEhpcmE0U3ByaW50U3RhY2sodGhpcyxcIkhpcmFTdGFja1wiKVxyXG4gICAgfVxyXG59Il19