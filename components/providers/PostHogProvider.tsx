"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

// PostHog 初期化（クライアント側のみ）
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only", // ログインユーザーのみ記録
    capture_pageview: false, // ページ遷移は別途 usePageView で管理
  });
}

// Clerk ユーザーと PostHog を紐付ける
function PostHogIdentifier() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const ph = usePostHog();

  useEffect(() => {
    if (isSignedIn && user) {
      // ユーザーIDとメールをPostHogに登録（誰がいつ何を見たか把握できる）
      ph.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? user.primaryEmailAddress?.emailAddress,
      });
    } else if (!isSignedIn) {
      ph.reset(); // ログアウト時はリセット
    }
  }, [isSignedIn, user, ph]);

  return null;
}

// ページ遷移を自動記録
function PostHogPageView() {
  const ph = usePostHog();

  useEffect(() => {
    ph.capture("$pageview");
  }, [ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogIdentifier />
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}
