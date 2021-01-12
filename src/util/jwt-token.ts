import * as jwt from "jsonwebtoken";

export class TokenExpiredError extends Error {}
class JwtToken {
    private generateToken(userKey: string, secretKey: string, expiresIn: string): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.sign(
                {userKey: userKey}, // 토큰의 정보
                secretKey, // 비밀키
                {expiresIn: expiresIn}, // 30분 후에 만료되는 토큰
                (err: any, token: string) => {
                    if (!err) {
                        resolve(token);
                    } else {
                        reject(err);
                    }
                },
            );
        });
    }

    private decodeToken(token: string, secretKey: string): string|null {
        try {
            const payload = jwt.verify(token, secretKey) as any;

            const userKey = payload.userKey as string;
            return userKey;
        } catch(e) {
            if (e instanceof jwt.TokenExpiredError) {
                throw TokenExpiredError;
                // console.log("TokenExpiredError");
            }

            return null;
        }
    }

    generateAccessToken = async (userKey: string): Promise<string> => {
        return await this.generateToken(userKey, process.env.JWT_ACCESS_SECRET as string, "30 minutes");
    };

    generateRefreshToken = async (userKey: string): Promise<string> => {
        return await this.generateToken(userKey, process.env.JWT_REFRESH_SECRET as string, "30 days");
    };

    decodeAccessToken = (token: string): string|null => {
        return this.decodeToken(token, process.env.JWT_ACCESS_SECRET as string);
    };

    decodeRefreshToken = (token: string): string|null => {
        return this.decodeToken(token, process.env.JWT_REFRESH_SECRET as string);
    };
}

export const jwtToken = new JwtToken();