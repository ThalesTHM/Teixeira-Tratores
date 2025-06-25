"server only";

import jwt from "jsonwebtoken";

export const signToken = (payload: Record<string, any>, JWT_SECRET: string, expiresIn: number) => {
    
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: expiresIn / 1000
    });
}

export function verifyToken(token: string, JWT_SECRET: string) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}