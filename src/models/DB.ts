import {Sequelize} from "sequelize-typescript";
import logger from "../util/logger";
import {Transaction} from "sequelize";
import {DATABASE, DB_URL, PASSWORD, USERNAME} from "../util/secrets";
import {TaskGroup} from "./table/work/taskgroup.model";
import {Task} from "./table/work/task.model";
import {ExtractMetadataTask} from "./table/work/extractmetadatatask.model";
import {SplitQuestionTask} from "./table/work/splitquestiontask.model";
import {MakePaperTask} from "./table/work/makepapertask.model";
import {Work} from "./table/work/work.model";

logger.debug(`connect with ${DB_URL}`);
logger.debug(`username ${USERNAME}`);
logger.debug(`password ${PASSWORD}`);
logger.debug(`database ${DATABASE}`);

export const db =  new Sequelize({
    host: DB_URL,
    database: DATABASE,
    dialect: "mysql",
    username: USERNAME,
    password: PASSWORD,
    models: [
        TaskGroup,
        Task,
        ExtractMetadataTask,
        SplitQuestionTask,
        MakePaperTask,
        Work
    ]
});

class TransactionManager {
    async runOnTransaction<T>(outerTransaction: Transaction|null|undefined, callback: ((t: Transaction) => Promise<T>)): Promise<T> {
        if (outerTransaction) {
            return callback(outerTransaction);
        }
        return db.transaction(async t => {
            return callback(t);
        });
    }
}
export const transactionManager = new TransactionManager();
