// import {paramUtil} from "../util/param";
// import {Transaction} from "sequelize";
// import {errorStore} from "../util/ErrorStore";
// import {ResultData} from "../models/table/work/resultdata.model";
//
// class ResultDataService {
//     async createResultData(workKey: string, result: string, outerTransaction?: Transaction): Promise<ResultData> {
//         const invalidParam = !paramUtil.checkParam(workKey, result);
//
//         if (invalidParam) {
//             throw new Error(errorStore.INVALID_PARAM);
//         }
//
//         const newResultData = await ResultData.create({
//             workKey: workKey,
//             result: result
//         }, {
//             transaction: outerTransaction
//         });
//
//         return newResultData;
//     }
// }
//
// export const resultDataService = new ResultDataService();
//# sourceMappingURL=resultdata.service.js.map