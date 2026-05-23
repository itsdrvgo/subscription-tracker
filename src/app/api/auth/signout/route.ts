import { COOKIES } from "@/config/const";
import { CResponse, handleError } from "@/lib/utils";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete(COOKIES.ADMIN);

        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
