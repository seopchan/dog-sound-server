import {NextFunction, Request, Response} from "express";
import AWS from "aws-sdk";
import {workGroupService} from "../service/workGroup.service";
import {workService} from "../service/work.service";
import {paramUtil} from "../util/param";
import {JsonObject} from "swagger-ui-express";
import {checkingUtil} from "../util/checking";
import {transactionManager} from "../models/DB";
import {WorkStatus} from "../models/schema/work/workgroup.schema";
import {WorkGroup} from "../models/table/work/workgroup.model";
import {errorStore} from "../util/ErrorStore";
import {ResultData} from "../models/table/work/resultdata.model";
import {
    AWS_ACCESS_KEY,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    EXTRACT_METADATA_SQS_URL,
    QUESTIONS_BUCKET
} from "../util/secrets";
import {awsService} from "../service/aws.service";

AWS.config.update({
   region: AWS_REGION,
   accessKeyId: AWS_ACCESS_KEY,
   secretAccessKey: AWS_SECRET_ACCESS_KEY
});

export const hwpMetadataExtract = async(req: Request, res: Response, next: NextFunction) => {
    console.log("extract");
    const workGroupId = req.body.workGroupId as string;

    if (!paramUtil.checkParam(workGroupId)) {
        console.log(Error(errorStore.BAD_REQUEST));
        return res.sendBadRequestError();
    }

    const s3 = new AWS.S3();

    const bucket = QUESTIONS_BUCKET as string;

    const questionWorkGroupId = workGroupId+"/question";
    const answerWorkGroupId = workGroupId+"/answer";
    const metadataWorkGroupId  = workGroupId+"/metadata";

    // 이미 workGroup이 있는지 확인
    const questionWorkGroup: WorkGroup | null = await WorkGroup.findOne({
        where: {
            workGroupId: questionWorkGroupId,
        }
    });
    const answerWorkGroup: WorkGroup | null = await WorkGroup.findOne({
        where: {
            workGroupId: answerWorkGroupId,
        }
    });

    if (questionWorkGroup == null || answerWorkGroupId == null) {
        const questionKeys = await workService.getAllKeys(questionWorkGroupId, s3, bucket);
        const answerKeys = await workService.getAllKeys(answerWorkGroupId, s3, bucket);
        const metadataKeys = await workService.getAllKeys(metadataWorkGroupId, s3, bucket);

        if (checkingUtil.checkIsNull(questionKeys, answerKeys, metadataKeys)) {
            console.log(Error(errorStore.NOT_FOUND));
            return res.sendNotFoundError();
        }

        let questionWorkGroup: WorkGroup;
        let answerWorkGroup: WorkGroup;
        let workKey: string;
        console.log("create workGroup");
        try {
            [questionWorkGroup, answerWorkGroup, workKey] = await transactionManager.runOnTransaction(null, async (t) => {
                const questionWorkGroup = await workGroupService.createWorkGroup(questionWorkGroupId, t);
                const workKey = questionWorkGroup.workKey;
                const answerWorkGroup = await workGroupService.createWorkGroup(answerWorkGroupId, t, workKey);

                return [questionWorkGroup, answerWorkGroup, workKey];
            });
        } catch (e) {
            console.log(e);
            await awsService.SNSNotification(String(e));
            return;
        }


        // 즉각 응답
        console.log("WorkKey : " + workKey);
        res.sendRs({
            data: {
                workKey: workKey
            }
        });

        // TODO 후처리를 queue로
        const sqsParams = {
            DelaySeconds: 10,
            MessageAttributes: {
                "questionWorkGroupId": {
                    DataType: "String",
                    StringValue: questionWorkGroup.workGroupId
                },
                "questionKeys": {
                    DataType: "String",
                    StringValue: questionKeys.toString()
                },
                "answerWorkGroupId": {
                    DataType: "String",
                    StringValue: answerWorkGroup.workGroupId
                },
                "answerKeys": {
                    DataType: "String",
                    StringValue: answerKeys.toString()
                },
                "metadataKeys": {
                    DataType: "String",
                    StringValue: metadataKeys.toString()
                },
                "bucket": {
                    DataType: "String",
                    StringValue: bucket
                },
                "workKey": {
                    DataType: "String",
                    StringValue: workKey
                },
            },
            MessageBody: "Lambda(hwp-metadata-extractor) Invoke",
            QueueUrl: EXTRACT_METADATA_SQS_URL as string
        };
        const sqs = new AWS.SQS({
            apiVersion: "2012-11-05"
        });
        console.log("sendMessage");
        await sqs.sendMessage(sqsParams).promise();
    } else if (questionWorkGroup.status == WorkStatus.SUCCESS && answerWorkGroup?.status == WorkStatus.SUCCESS){
        res.sendRs({
            data: {
                workKey: questionWorkGroup.workKey
            }
        });

        const resultData: ResultData | null = await ResultData.findOne({
            where: {
                workKey: questionWorkGroup.workKey
            }
        });
        if (!resultData) {
            console.log(Error(errorStore.NOT_FOUND));
            await awsService.SNSNotification(String(Error(errorStore.NOT_FOUND)));
            return res.sendNotFoundError();
        }

        // await awsService.SNSNotification(JSON.stringify(resultData));
        console.log("return");
        return;
    } else {
        const workKey = questionWorkGroup.workKey;
        if (!workKey) {
            console.log(Error(errorStore.NOT_FOUND));
            return res.sendNotFoundError();
        }

        return res.sendRs({
            data: {
                workKey: workKey
            }
        });
    }

    return;
};

export const questionSplit = async(req: Request, res: Response, next: NextFunction) => {
    const questionFileKey = req.body.questionFileKey as string;
    const answerFileKey = req.body.answerFileKey as string;
    const callbackUrl = req.body.callbackUrl as string;

    if (!paramUtil.checkParam(questionFileKey, answerFileKey, callbackUrl)) {
        return res.sendBadRequestError();
    }

    const workGroupId = await getWorkGroupId();

    const questionWorkGroup = await workGroupService.createWorkGroup(workGroupId);
    const workKey = questionWorkGroup.workKey;

    res.sendRs({
        data: {
            workKey: workKey
        }
    });

    const questionWork = await workService.createWork(questionWorkGroup, questionFileKey);

    try {
        await workService.executeQuestionSplit(questionWorkGroup, questionWork, questionFileKey, answerFileKey);
    } catch (e) {
        return res.sendBadRequestError(e);
    }
};

export const makePaper = async(req: Request, res: Response, next: NextFunction) => {
    const questionFileKeys = req.body.questionFileKeys as string[];
    const dynamicContents = req.body.dynamicContents as JsonObject;

    if (!paramUtil.checkParam(questionFileKeys)) {
        return res.sendBadRequestError();
    }

    const workGroupId = await getWorkGroupId();

    const questionWorkGroup = await workGroupService.createWorkGroup(workGroupId);
    const workKey = questionWorkGroup.workKey;

    res.sendRs({
        data: {
            workKey: workKey
        }
    });

    const questionWork = await workService.createWork(questionWorkGroup, questionFileKeys[0]);

    try {
        await workService.executeMakePaper(questionWorkGroup, questionWork, questionFileKeys, dynamicContents);
    } catch (e) {
        return res.sendBadRequestError(e);
    }
    
};

async function getWorkGroupId(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = ("0" + (1 + date.getMonth())).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);

    return (year + "-" + month + "-" + day+ "/" + await uuidv4()) as string;
}

async function uuidv4(): Promise<string> {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16) as string;
    });
}