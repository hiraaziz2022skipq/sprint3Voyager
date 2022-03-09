"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.isCompleteHandler=exports.onEventHandler=void 0;const aws_sdk_1=require("aws-sdk");async function onEventHandler(event){var _a,_b;console.log("Event: %j",event);const dynamodb=new aws_sdk_1.DynamoDB,tableName=event.ResourceProperties.TableName,region=event.ResourceProperties.Region;let updateTableAction;if(event.RequestType==="Create"||event.RequestType==="Delete")updateTableAction=event.RequestType;else{const describeTableResult=await dynamodb.describeTable({TableName:tableName}).promise();console.log("Describe table: %j",describeTableResult),updateTableAction=((_b=(_a=describeTableResult.Table)===null||_a===void 0?void 0:_a.Replicas)===null||_b===void 0?void 0:_b.some(replica=>replica.RegionName===region))?void 0:"Create"}if(updateTableAction){const data=await dynamodb.updateTable({TableName:tableName,ReplicaUpdates:[{[updateTableAction]:{RegionName:region}}]}).promise();console.log("Update table: %j",data)}else console.log("Skipping updating Table, as a replica in '%s' already exists",region);return event.RequestType==="Create"||event.RequestType==="Update"?{PhysicalResourceId:`${tableName}-${region}`}:{}}exports.onEventHandler=onEventHandler;async function isCompleteHandler(event){var _a,_b,_c;console.log("Event: %j",event);const data=await new aws_sdk_1.DynamoDB().describeTable({TableName:event.ResourceProperties.TableName}).promise();console.log("Describe table: %j",data);const tableActive=((_a=data.Table)===null||_a===void 0?void 0:_a.TableStatus)==="ACTIVE",regionReplica=((_c=(_b=data.Table)===null||_b===void 0?void 0:_b.Replicas)!==null&&_c!==void 0?_c:[]).find(r=>r.RegionName===event.ResourceProperties.Region),replicaActive=(regionReplica==null?void 0:regionReplica.ReplicaStatus)==="ACTIVE",skipReplicationCompletedWait=event.ResourceProperties.SkipReplicationCompletedWait==="true";switch(event.RequestType){case"Create":case"Update":return{IsComplete:tableActive&&(replicaActive||skipReplicationCompletedWait)};case"Delete":return{IsComplete:tableActive&&regionReplica===void 0}}}exports.isCompleteHandler=isCompleteHandler;
//# sourceMappingURL=index.js.map
