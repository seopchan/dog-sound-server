import {NextFunction, Request, Response} from "express";
import AWS from "aws-sdk";
import {workGroupService} from "../service/workGroup.service";
import {workService} from "../service/work.service";
import {paramUtil} from "../util/param";
import {JsonObject} from "swagger-ui-express";
import {WorkType} from "../models/schema/work/workgroup.schema";

export const hwpMetadataExtract = async(req: Request, res: Response, next: NextFunction) => {
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
    allKeys = await workService.getAllKeys(workGroupId, s3, allKeys, bucket);
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

    try {
        await workService.executeQuestionMetadataExtract(questionWorkGroup, questionWorks, allKeys, dynamicContents);
    } catch (e) {
        return res.sendBadRequestError(e);
    }
};

export const questionSplit = async(req: Request, res: Response, next: NextFunction) => {
    const questionFileKey = req.body.questionFileKey as string;
    const answerFileKey = req.body.answerFileKey as string;
    const callbackUrl = req.body.callbackUrl as string;

    if (!paramUtil.checkParam(questionFileKey, answerFileKey, callbackUrl)) {
        return res.sendBadRequestError();
    }

    const workGroupId = await getWorkGroupId();

    const questionWorkGroup = await workGroupService.createWorkGroup(callbackUrl, workGroupId);
    const taskKey = questionWorkGroup.taskKey;

    res.sendRs({
        data: {
            taskKey: taskKey
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
    const sources = req.body.sources as string[];
    const dynamicContents = req.body.dynamicContents as JsonObject;
    const workType = req.body.workType as WorkType;
    const callbackUrl = req.body.callbackUrl as string;

    if (!paramUtil.checkParam(sources, workType)) {
        return res.sendBadRequestError();
    }

    const workGroupId = await getWorkGroupId();

    const questionWorkGroup = await workGroupService.createWorkGroup(callbackUrl, workGroupId);
    const taskKey = questionWorkGroup.taskKey;

    res.sendRs({
        data: {
            taskKey: taskKey
        }
    });

    const questionWork = await workService.createWork(questionWorkGroup, sources[0]);

    try {
        await workService.executeMakePaper(questionWorkGroup, questionWork, sources, dynamicContents, workType);
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