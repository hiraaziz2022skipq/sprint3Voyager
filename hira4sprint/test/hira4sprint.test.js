"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const Hira4Sprint = require("../lib/hira4sprint-stack");
test('S3 Bucket Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Hira4Sprint.Hira4SprintStack(app, 'MyTestStack');
    // THEN
    const template = cdk.assertions.Template.fromStack(stack);
    template.resourceCountIs('AWS::S3::Bucket', 1);
});
// test('Lambda Function Created', () => {
//   const app = new cdk.App();
//   // WHEN
//   const stack = new Hira4Sprint.Hira4SprintStack(app, 'MyTestStack');
//   // THEN
//   const template = cdk.assertions.Template.fromStack(stack);
//   template.resourceCountIs('AWS::Lambda::Function', 0);
// });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhpcmE0c3ByaW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFFbkMsd0RBQXdEO0FBR3hELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7SUFDN0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDMUIsT0FBTztJQUNQLE1BQU0sS0FBSyxHQUFHLElBQUksV0FBVyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNuRSxPQUFPO0lBQ1AsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFELFFBQVEsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDakQsQ0FBQyxDQUFDLENBQUM7QUFFSCwwQ0FBMEM7QUFDMUMsK0JBQStCO0FBQy9CLFlBQVk7QUFDWix3RUFBd0U7QUFDeEUsWUFBWTtBQUNaLCtEQUErRDtBQUUvRCwwREFBMEQ7QUFDMUQsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUZW1wbGF0ZSwgTWF0Y2ggfSBmcm9tICdhd3MtY2RrLWxpYi9hc3NlcnRpb25zJztcbmltcG9ydCAqIGFzIEhpcmE0U3ByaW50IGZyb20gJy4uL2xpYi9oaXJhNHNwcmludC1zdGFjayc7XG5cblxudGVzdCgnUzMgQnVja2V0IENyZWF0ZWQnLCAoKSA9PiB7XG4gIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gIC8vIFdIRU5cbiAgY29uc3Qgc3RhY2sgPSBuZXcgSGlyYTRTcHJpbnQuSGlyYTRTcHJpbnRTdGFjayhhcHAsICdNeVRlc3RTdGFjaycpO1xuICAvLyBUSEVOXG4gIGNvbnN0IHRlbXBsYXRlID0gY2RrLmFzc2VydGlvbnMuVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcbiAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OlMzOjpCdWNrZXQnLCAxKTtcbn0pO1xuXG4vLyB0ZXN0KCdMYW1iZGEgRnVuY3Rpb24gQ3JlYXRlZCcsICgpID0+IHtcbi8vICAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbi8vICAgLy8gV0hFTlxuLy8gICBjb25zdCBzdGFjayA9IG5ldyBIaXJhNFNwcmludC5IaXJhNFNwcmludFN0YWNrKGFwcCwgJ015VGVzdFN0YWNrJyk7XG4vLyAgIC8vIFRIRU5cbi8vICAgY29uc3QgdGVtcGxhdGUgPSBjZGsuYXNzZXJ0aW9ucy5UZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuXG4vLyAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywgMCk7XG4vLyB9KTtcbiJdfQ==