import {NextFunction} from "express";
import {paramUtil} from "../util/param";
import {Result} from "./innerService/work.inner.service";
import {Transaction} from "sequelize";
import {errorStore} from "../util/ErrorStore";
import {ResultData} from "../models/table/work/resultdata.model";

class ResultDataService {
    async createResultData(workKey: string, data: Result[], outerTransaction?: Transaction): Promise<ResultData> {
        const invalidParam = !paramUtil.checkParam(workKey, data);

        if (invalidParam) {
            throw new Error(errorStore.INVALID_PARAM);
        }

        const result = JSON.stringify(data);

        const newResultData = await ResultData.create({
            workKey: workKey,
            result: result
        }, {
            transaction: outerTransaction
        });

        return newResultData;
    }
}

export const resultDataService = new ResultDataService();