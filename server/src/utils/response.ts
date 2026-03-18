import { environment } from "../config/env.js";

interface SuccessResponse {
    status: "success";
    data: any;
}

interface ErrorResponse {
    status: "error";
    message: string;
    errors?: any;
}

export const successResponse = (data: any): SuccessResponse => ({
    status: "success",
    data,
});

export const errorResponse = (message: string, errors?: any): ErrorResponse => ({
    status: "error",
    message,
    ...(environment.NODE_ENV === "development" && { errors }),
});