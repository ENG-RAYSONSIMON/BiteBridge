import { JwtPayload } from "../utils/functions";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export { };
