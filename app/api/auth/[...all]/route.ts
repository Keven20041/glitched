import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/app/lib/auth";

export const GET = async (...args: Parameters<ReturnType<typeof toNextJsHandler>["GET"]>) => {
	const { GET: getHandler } = toNextJsHandler(auth());
	return getHandler(...args);
};

export const POST = async (...args: Parameters<ReturnType<typeof toNextJsHandler>["POST"]>) => {
	const { POST: postHandler } = toNextJsHandler(auth());
	return postHandler(...args);
};
