import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
	const session = await auth();
	const { pathname } = request.nextUrl;
	const publicPaths = ["/login", "/register", "/"];
	if (!session?.user && !publicPaths.some((p) => pathname.startsWith(p))) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api/auth|_next/static|_next/image|manifest|icon|apple-icon|sw\\.js|favicon).*)",
	],
};
