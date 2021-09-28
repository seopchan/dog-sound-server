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
exports.extractMetadataTaskInnerService = void 0;
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const secrets_1 = require("../../util/secrets");
class ExtractMetadataTaskInnerService {
    mappingMetadata(metadataResponse, questionKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = metadataResponse.find((response) => {
                const metadataKey = lodash_clonedeep_1.default(response.key);
                return questionKey == metadataKey.replace("json", "hwp").replace("questionMetadata", "question");
            });
            if (response == undefined) {
                throw new Error("Question And Metadata Are Not Mapped");
            }
            const metadataObject = JSON.parse(response.metadata);
            const questionMetadata = {
                level: metadataObject.level,
                publisher: metadataObject.publisher,
                tag: metadataObject.tag,
                category: metadataObject.category,
                type: metadataObject.type,
                apply: metadataObject.apply,
                target: metadataObject.target
            };
            return questionMetadata;
        });
    }
    mappingAnswerMetadata(answerExtractResponse, questionFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const answerExtractedData = answerExtractResponse.find((answerExtractedData) => {
                const aEDObject = JSON.parse(answerExtractedData);
                const answerFileName = aEDObject.key.split("/").pop();
                return questionFileName == answerFileName;
            });
            if (answerExtractedData == undefined) {
                throw new Error("Question And Answer Are Not Mapped");
            }
            const aEDObject = JSON.parse(answerExtractedData);
            const key = aEDObject.key;
            const metadata = {
                imageHeight: aEDObject.height,
                thumbnailKey: aEDObject.thumbnailKey,
                extractedImageKey: aEDObject.extractedImageKey,
                text: aEDObject.text,
                bucket: secrets_1.HWP_METADATA_BUCKET
            };
            return [key, metadata];
        });
    }
    mappingWC(questionExtractResponse, questionFileName, questionKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const questionExtractData = questionExtractResponse.find((questionExtractedData) => {
                const qEDObject = JSON.parse(questionExtractedData);
                const wcQuestionKey = qEDObject.key;
                return wcQuestionKey.includes("_WC\.") && (questionKey == wcQuestionKey.replace("_WC", ""));
            });
            if (questionExtractData == undefined) {
                throw new Error("Question And WC Are Not Mapped");
            }
            const qEDObject = JSON.parse(questionExtractData);
            const metadata = {
                imageHeight: qEDObject.height,
                thumbnailKey: qEDObject.thumbnailKey,
                extractedImageKey: qEDObject.extractedImageKey,
                text: qEDObject.text,
                bucket: secrets_1.HWP_METADATA_BUCKET
            };
            const wc = {
                questionKey: qEDObject.key,
                questionFileMetadata: metadata
            };
            return wc;
        });
    }
    getMetadata(questionMetadata, questionFileMetadata, answerFileMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                category: questionMetadata.category,
                level: questionMetadata.level,
                publisher: questionMetadata.publisher,
                tag: questionMetadata.tag,
                type: questionMetadata.type,
                apply: questionMetadata.apply,
                target: questionMetadata.target,
                questionFileMetadata: questionFileMetadata,
                answerFileMetadata: answerFileMetadata
            };
        });
    }
    getResult(questionGroupKey, wc, questionKey, answerKey, metadata, taskGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                bucket: secrets_1.HWP_METADATA_BUCKET,
                questionGroupKey: questionGroupKey,
                wc: wc,
                questionKey: questionKey,
                answerKey: answerKey,
                metadata: metadata,
                taskGroupId: taskGroupId
            };
        });
    }
}
exports.default = ExtractMetadataTaskInnerService;
exports.extractMetadataTaskInnerService = new ExtractMetadataTaskInnerService();
//# sourceMappingURL=extractMetadataTask.inner.service.js.map