import {Sequelize} from "sequelize-typescript";
import logger from "../util/logger";
import {Transaction} from "sequelize";
import {Work} from "./table/work/work.model";
import {WorkGroup} from "./table/work/workgroup.model";
import {DATABASE, DB_URL, PASSWORD, USERNAME} from "../util/secrets";
import {ResultData} from "./table/work/resultdata.model";

logger.debug(`connect with ${DB_URL}`);
logger.debug(`username ${USERNAME}`);
logger.debug(`password ${PASSWORD}`);
logger.debug(`database ${DATABASE}`);

export const db =  new Sequelize({
    pool: {
        // max: 20,
        // acquire: 10000
        max: 5,

    },
    host: DB_URL,
    database: DATABASE,
    dialect: "mysql",
    username: USERNAME,
    password: PASSWORD,
    models: [
        Work,
        WorkGroup,
        ResultData
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
