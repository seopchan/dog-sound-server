import {NextFunction, Request, Response} from "express";
import AWS from "aws-sdk";
import {workGroupService} from "../service/workGroup.service";
import {workService} from "../service/work.service";
import {paramUtil} from "../util/param";
import {JsonObject} from "swagger-ui-express";
import {checkingUtil} from "../util/checking";
import {transactionManager} from "../models/DB";
import {MetadataResult, Result} from "../service/innerService/work.inner.service";

export const hwpMetadataExtract = async(req: Request, res: Response, next: NextFunction) => {
    const workGroupId = req.body.workGroupId as string;

    if (!paramUtil.checkParam(workGroupId)) {
        return res.sendBadRequestError();
    }

    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

    const bucket = `${process.env.QUESTIONS_BUCKET}`;

    const questionWorkGroupId = workGroupId+"/question";
    const answerWorkGroupId = workGroupId+"/answer";
    const metadataWorkGroupId  = workGroupId+"/metadata";

    const questionKeys = await workService.getAllKeys(questionWorkGroupId, s3, bucket);
    const answerKeys = await workService.getAllKeys(answerWorkGroupId, s3, bucket);
    const metadataKeys = await workService.getAllKeys(metadataWorkGroupId, s3, bucket);

    if (checkingUtil.checkIsNull(questionKeys, answerKeys, metadataKeys)) {
        return res.sendNotFoundError();
    }

    const [questionWorkGroup, answerWorkGroup, workKey] = await transactionManager.runOnTransaction(null, async (t) => {
        const questionWorkGroup = await workGroupService.createWorkGroup(questionWorkGroupId, t);
        const workKey = questionWorkGroup.workKey;
        const answerWorkGroup = await workGroupService.createWorkGroup(answerWorkGroupId, t, workKey);

        return [questionWorkGroup, answerWorkGroup, workKey];
    });

    // 즉각 응답
    res.sendRs({
        data: {
            workKey: workKey
        }
    });

    const [questionWorks, answerWorks] = await transactionManager.runOnTransaction(null, async (t) => {
        const questionWorks = await workService.createWorks(questionWorkGroup, questionKeys, t);
        const answerWorks = await workService.createWorks(answerWorkGroup, answerKeys, t);

        return [questionWorks, answerWorks];
    });

    const metadataResponse: MetadataResult[] = await workService.getMetadataList(metadataKeys, s3, bucket);
    const questionExtractResponse: string[] = await workService.executeQuestionMetadataExtract(questionWorkGroup, questionWorks, questionKeys);
    const answerExtractResponse: string[] = await workService.executeQuestionMetadataExtract(answerWorkGroup, answerWorks, answerKeys);

    /**
     * 1. 일반문제 -> 문제+답+메타데이터
     * 2. 공통문제 -> 문제+답+메타데이터+그룹ID+WC
     * 3. 공통문제_WC -> pass
     */
    const data: Result[] = await workService.mappingData(questionExtractResponse, answerExtractResponse, metadataResponse);
    const message = {
        data : data,
        workKey : workKey
    };

    const params = {
        Message: JSON.stringify(message),
        TopicArn: `${process.env.EXTRACT_METADATA}`
    };

    const snsResponse = new AWS.SNS({apiVersion: "2010-03-31"}).publish(params).promise();

    snsResponse.then().catch(function(err) {
        throw new Error(err);
    });
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