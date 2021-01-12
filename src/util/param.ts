class ParamUtil {
    checkParam = (...params: any[]): boolean =>  {
        let check = true;
        params.forEach((param) => {
            if (!param) {
                check = false;
            }
        });
        return check;
    }
}
export const paramUtil = new ParamUtil();
