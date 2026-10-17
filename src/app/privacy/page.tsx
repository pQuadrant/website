import type { Metadata } from "next";

import { PrivacyPolicy } from "@/components/privacy/PrivacyPolicy";
import { chromeContent } from "@/content/chrome";
import { privacyContent } from "@/content/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | pQuadrant",
  description:
    "How pQuadrant collects, uses and protects personal information through pquadrant.com.",
};

/** Outside the `(stage)` group, so it does not mount the globe or starfield. */
export default function PrivacyPage() {
  return (
    <PrivacyPolicy
      content={privacyContent}
      wordmark={chromeContent.topLeft.wordmark}
    />
  );
}
