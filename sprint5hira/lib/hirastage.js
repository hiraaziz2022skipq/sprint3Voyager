"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hirastage = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const sprint5hira_stack_1 = require("./sprint5hira-stack");
class Hirastage extends aws_cdk_lib_1.Stage {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Instantiate Stack      
        const hira4stack = new sprint5hira_stack_1.Sprint5HiraStack(this, "HiraStack");
    }
}
exports.Hirastage = Hirastage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYXN0YWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaGlyYXN0YWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUFzRDtBQUV0RCwyREFBdUQ7QUFHdkQsTUFBYSxTQUFVLFNBQVEsbUJBQUs7SUFDaEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV0QiwwQkFBMEI7UUFDekIsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQ0FBZ0IsQ0FBQyxJQUFJLEVBQUMsV0FBVyxDQUFDLENBQUE7SUFDOUQsQ0FBQztDQUNKO0FBUEQsOEJBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdGFjaywgU3RhY2tQcm9wcywgU3RhZ2V9IGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCB7IFNwcmludDVIaXJhU3RhY2sgfSBmcm9tICcuL3NwcmludDVoaXJhLXN0YWNrJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgSGlyYXN0YWdlIGV4dGVuZHMgU3RhZ2Uge1xyXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XHJcbiAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgICAgICAvLyBJbnN0YW50aWF0ZSBTdGFjayAgICAgIFxyXG4gICAgICAgICBjb25zdCBoaXJhNHN0YWNrID0gbmV3IFNwcmludDVIaXJhU3RhY2sodGhpcyxcIkhpcmFTdGFja1wiKVxyXG4gICAgfVxyXG59Il19