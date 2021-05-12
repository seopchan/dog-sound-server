import {
    AWS_ACCESS_KEY,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    EXTRACT_METADATA_SNS,
    EXTRACT_METADATA_SQS_URL,
    GONGBACK_SNS
} from "../util/secrets";
import {PromiseResult} from "aws-sdk/lib/request";
import AWS, {AWSError, SNS} from "aws-sdk";
import {errorStore} from "../util/ErrorStore";
import {MessageAttributeMap} from "aws-sdk/clients/sns";

AWS.config.update({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

class AwsService {
    async SNSNotification(message: string, moduleSns: string): Promise<boolean> {
        // const extractMetadata =  as string;
        const gongbackSns = GONGBACK_SNS as string;

        try {
            await this._SNSNotification(message, moduleSns);
            await this._SNSNotification(message, gongbackSns);
        } catch (e) {
            console.log(e);
            return false;
        }

        return true;
    }

    async _SNSNotification(message: string, topicArn: string): Promise<PromiseResult<SNS.PublishResponse, AWSError>> {
        const params = {
            Message: message,
            TopicArn: topicArn
        };

        const snsResponse = new AWS.SNS({apiVersion: "2010-03-31"}).publish(params).promise();
        if (!snsResponse) {
            throw new Error(errorStore.NOT_FOUND);
        }

        return snsResponse;
    }

}

export const awsService = new AwsService();