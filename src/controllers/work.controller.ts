import {NextFunction, Request, Response} from "express";
import AWS from "aws-sdk";
import {workGroupService} from "../service/workGroup.service";
import {workService} from "../service/work.service";
import {WorkStatus} from "../models/schema/work/workgroup.schema";
import {paramUtil} from "../util/param";
import {transactionManager} from "../models/DB";
import {Work} from "../models/table/work/work.model";
import {WorkGroup} from "../models/table/work/workgroup.model";
import Semaphore from "semaphore";
import {JsonObject} from "swagger-ui-express";

export const work = async(req: Request, res: Response, next: NextFunction) => {
    const workGroupId = req.body.workGroupId as string;
    const callbackUrl = req.body.callbackUrl as string;
    const dynamicContents = req.body.dynamicContents as JsonObject;

    if (!paramUtil.checkParam(workGroupId, callbackUrl)) {
        return res.sendBadRequestError();
    }

    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    let allKeys: string[] = [];
    const bucket = `${process.env.QUESTIONS_BUCKET}`;
    allKeys = await getAllKeys(workGroupId, s3, allKeys, bucket);
    if (allKeys.length == 0) {
        return res.sendNotFoundError();
    }

    const questionWorkGroup = await workGroupService.createWorkGroup(callbackUrl, workGroupId);
    const taskKey = questionWorkGroup.taskKey;

    // 즉각 응답
    res.sendRs({
        data: {
            taskKey: taskKey
        }
    });

    const questionWorks = await workService.createWorks(questionWorkGroup, allKeys);

    await executeLambda(questionWorkGroup, questionWorks, allKeys, dynamicContents);
};

async function getAllKeys(workGroupId: string, s3: AWS.S3, allKeys: string[], bucket: string, params?: any) {
    if(!params) {
        params = {
            Bucket: bucket,
            Prefix: workGroupId
        };
    }

    const response = await s3.listObjectsV2(params).promise();
    if(response.Contents) {
        response.Contents.forEach( content => {
            const key = content.Key as string;
            allKeys.push(key);
        } );
    }
    if (response.NextContinuationToken) {
        params.ContinuationToken = response.NextContinuationToken;
        allKeys = await getAllKeys(workGroupId, s3, allKeys, bucket, params);
    }

    return allKeys;
}

async function executeLambda(workGroup: WorkGroup, works: Work[], allKeys: string[], dynamicContents: JsonObject) {
    const layout = `${process.env.LAYOUT_FILE}`;
    const totalWorkCount = await workService.countWork(workGroup);
    const semaphore = Semaphore(10);

    for (const key of allKeys) {
        const work = works[allKeys.indexOf(key)];

        if (dynamicContents == null) {
            dynamicContents = {
                data : null
            };
        }
        const set = {
            layout: layout,
            source : `["${key}"]`,
            dynamicContents : JSON.stringify(dynamicContents),
        };
        const payload = [set];
        const params = {
            FunctionName: `${process.env.SINGLE_MODULE_URL}`,
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(payload)
        };

        semaphore.take(function () {
            const lambda = new AWS.Lambda();
            lambda.invoke(params, async function (err, data) {
                let otherError = undefined;
                if (typeof data.Payload == "string") {
                    otherError = JSON.parse(data.Payload).errorMessage;
                }

                if (err || otherError) {
                    await workService.updateStatus(work, WorkStatus.FAIL);
                    const workGroupStatus = await workGroupService.checkStatus(workGroup);
                    if (workGroupStatus == WorkStatus.WAIT) {
                        await transactionManager.runOnTransaction(null, async (t) => {
                            const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.FAIL);
                            await workGroupService.callbackToApiServer(updateWorkGroup);
                        });
                    }
                } else if (data) {
                    await workService.updateStatus(work, WorkStatus.SUCCESS);
                    const isSuccess = await workService.checkIsSuccess(workGroup, totalWorkCount);
                    if (isSuccess) {
                        await transactionManager.runOnTransaction(null, async (t) => {
                            const updateWorkGroup = await workGroupService.updateWorkGroupStatus(workGroup, WorkStatus.SUCCESS);
                            await workGroupService.callbackToApiServer(updateWorkGroup);
                        });
                    }
                }
                semaphore.leave();
            });
        });
    }
}
