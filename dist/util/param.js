"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paramUtil = void 0;
class ParamUtil {
    constructor() {
        this.checkParam = (...params) => {
            let check = true;
            params.forEach((param) => {
                if (!param) {
                    check = false;
                }
            });
            return check;
        };
    }
}
exports.paramUtil = new ParamUtil();
//# sourceMappingURL=param.js.map