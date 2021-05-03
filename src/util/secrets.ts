export const DB_URL = process.env["DB_URL"];
export const USERNAME = process.env["USERNAME"];
export const PASSWORD = process.env["PASSWORD"];
export const DATABASE = process.env["DATABASE"];

export const AWS_ACCESS_KEY = process.env["AWS_ACCESS_KEY"];
export const AWS_SECRET_ACCESS_KEY = process.env["AWS_SECRET_ACCESS_KEY"];
export const AWS_REGION = process.env["AWS_REGION"];

export const QUESTIONS_BUCKET = process.env["QUESTIONS_BUCKET"] as string;

export const LAYOUT_FILE = process.env["LAYOUT_FILE"];

export const QUESTION_EXTRACTOR_LAMBDA = process.env["QUESTION_EXTRACTOR_LAMBDA"];
export const QUESTION_SPLIT_LAMBDA = process.env["QUESTION_SPLIT_LAMBDA"];
export const MAKE_PAPER_LAMBDA = process.env["MAKE_PAPER_LAMBDA"];

export const SPLIT_QUESTION_SNS = process.env["SPLIT_QUESTION_SNS"];
export const EXTRACT_METADATA_SNS = process.env["EXTRACT_METADATA_SNS"];
export const MERGE_SNS = process.env["MERGE_SNS"];
export const GONGBACK_SNS = process.env["GONGBACK_SNS"];

export const EXTRACT_METADATA_SQS_URL = process.env["EXTRACT_METADATA_SQS_URL"];
