import cloneDeep from "lodash.clonedeep";
import {Transaction} from "sequelize";
import {QUESTIONS_BUCKET} from "../../util/secrets";

export interface MetadataResult {
    metadata: string;
    key: string;
}

export interface Result {
    bucket: string;

    questionKey: string;
    answerKey: string;
    metadata: Metadata;

    questionGroupKey?: string;
    wc?: WC;
}

export interface FileMetadata {
    imageHeight: number;
    thumbnailKey: string;
    extractedImageKey: string;
    text: string;
}

export interface WC {
    questionKey: string;
    questionFileMetadata: FileMetadata;
}

export interface Metadata {
    level: string | null;
    publisher: string | null;
    tag: string | null;
    category: string | null;
    type: string | null;
    questionFileMetadata: FileMetadata;
    answerFileMetadata: FileMetadata;
}

interface QuestionMetadata {
    level: string | null;
    publisher: string | null;
    tag: string | null;
    category: string | null;
    type: string | null;
}

export default class WorkInnerService {
    async mappingMetadata(metadataResponse: MetadataResult[], questionKey: string): Promise<QuestionMetadata> {
        const response = metadataResponse.find((response) => {
            const metadataKey = cloneDeep(response.key);

            return questionKey == metadataKey.replace("json", "hwp").replace("metadata", "question");
        });

        if (response == undefined) {
            throw new Error("Question And Metadata Are Not Mapped");
        }

        const metadataObject = JSON.parse(response.metadata);

        const questionMetadata: QuestionMetadata = {
            level: metadataObject.level,
            publisher: metadataObject.publisher,
            tag: metadataObject.tag,
            category: metadataObject.category,
            type: metadataObject.type
        };

        return questionMetadata as QuestionMetadata;
    }

    async mappingAnswerMetadata(answerExtractResponse: string[], questionFileName: string, outerTransaction?: Transaction): Promise<[string, FileMetadata]> {
        const answerExtractedData: string | undefined = answerExtractResponse.find((answerExtractedData) => {
            const aEDObject = JSON.parse(answerExtractedData);
            const answerFileName = aEDObject.key.split("/").pop();

            return questionFileName == answerFileName;
        });

        if (answerExtractedData == undefined) {
            throw new Error("Question And Answer Are Not Mapped");
        }

        const aEDObject = JSON.parse(answerExtractedData);

        const key = aEDObject.key as string;

        const metadata: FileMetadata = {
            imageHeight: aEDObject.height as number,
            thumbnailKey: aEDObject.thumbnailKey as string,
            extractedImageKey: aEDObject.extractedImageKey as string,
            text: aEDObject.text as string
        };

        return [key, metadata] as [string, FileMetadata];
    }

    async mappingWC(questionExtractResponse: string[], questionFileName: string, questionKey: string): Promise<WC> {
        const questionExtractData = questionExtractResponse.find((questionExtractedData) => {
            const qEDObject = JSON.parse(questionExtractedData);
            const wcQuestionKey = qEDObject.key;

            return wcQuestionKey.includes("_WC\.") && (questionKey == wcQuestionKey.replace("_WC", ""));
        });

        if (questionExtractData == undefined) {
            throw new Error("Question And WC Are Not Mapped");
        }

        const qEDObject = JSON.parse(questionExtractData);

        const metadata: FileMetadata = {
            imageHeight: qEDObject.height as number,
            thumbnailKey: qEDObject.thumbnailKey as string,
            extractedImageKey: qEDObject.extractedImageKey as string,
            text: qEDObject.text as string
        };

        const wc: WC = {
            questionKey: qEDObject.key as string,
            questionFileMetadata: metadata
        };

        return wc;
    }

    async getMetadata(questionMetadata: QuestionMetadata, questionFileMetadata: FileMetadata, answerFileMetadata: FileMetadata): Promise<Metadata> {
        return {
            category: questionMetadata.category,
            level: questionMetadata.level,
            publisher: questionMetadata.publisher,
            tag: questionMetadata.tag,
            type: questionMetadata.type,

            questionFileMetadata: questionFileMetadata,
            answerFileMetadata: answerFileMetadata
        };
    }

    async getResult(questionGroupKey: string | undefined, wc: WC | undefined, questionKey: string, answerKey: string, metadata: Metadata): Promise<Result> {
        return {
            bucket: QUESTIONS_BUCKET,

            questionGroupKey: questionGroupKey,
            wc: wc,

            questionKey: questionKey,
            answerKey: answerKey,
            metadata: metadata,
        };
    }
}

export const workInnerService = new WorkInnerService();