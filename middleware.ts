import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ログインが必要なページ
const isProtectedRoute = createRouteMatcher([
  "/analytics(.*)",
  "/simulator(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // 未ログインなら /sign-in にリダイレクト
  }
});

export const config = {
  matcher: [
    // Next.js の内部ファイルと静的ファイルをスキップ
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
