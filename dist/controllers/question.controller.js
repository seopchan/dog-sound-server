"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionProcessing = void 0;
const param_1 = require("../util/param");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
exports.questionProcessing = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!param_1.paramUtil.checkParam( /* TODO */)) {
        return res.sendBadRequestError();
    }
    //TODO call되면 taskKey(random) 생성
    /*
        1. lambda n번(문제 수) 요청
        2. callback
     */
    // const payload = JSON.stringify({
    //     "layout": "https://sample-questions.s3.ap-northeast-2.amazonaws.com/layout.hwp",
    //     "question": "https://split-questions.s3.ap-northeast-2.amazonaws.com/2020-12-17-3a0b23f8-23bb-4342-b487-9df09884ed97/1.hwp",
    //     "folderName": "test1",
    //     "fileName": "3"
    // })
    const source = JSON.stringify({
        "layout": "layout.hwp",
        "question": "2020-12-17-3a0b23f8-23bb-4342-b487-9df09884ed97/1.hwp",
    });
    const payload = JSON.stringify([{
            source: source,
            target: "test1/5.hwp"
        }]);
    const params = {
        FunctionName: "arn:aws:lambda:ap-northeast-2:657673154372:function:question-module-control",
        InvocationType: "RequestResponse",
        Payload: payload
    };
    const lambda = new aws_sdk_1.default.Lambda();
    lambda.invoke(params, function (err, data) {
        if (err)
            console.log(err, err.stack);
        else {
            console.log("data" + data.Payload);
            return res.sendRs({
                data: {
                    success: data.Payload,
                }
            });
        }
    });
});
//# sourceMappingURL=question.controller.js.map