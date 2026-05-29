import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">定借ナビ</h1>
        <p className="text-slate-500 text-sm">ログインしてご利用ください</p>
      </div>
      <SignIn />
    </div>
  );
}
