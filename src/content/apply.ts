import type { ApplyContent } from "@/content/types";

/**
 * The apply flow's copy: the APPLY NOW button, the two-step form and the
 * screen that follows it. Not final.
 *
 * The form is short on purpose, so it fits the panel without scrolling; adding
 * a question is a product decision. Messages sit in half-width columns on a
 * phone, so each is kept to one line there; a longer one makes the panel
 * scroll on short phones. See Apply flow in `codebase-map/apply.md`.
 */

export const applyContent: ApplyContent = {
  trigger: "APPLY NOW",
  title: "Apply for access",
  intros: [
    "Tell us who you are and how to reach you.",
    "Tell us about your business and goals.",
  ],
  progress: {
    shown: (step, steps) => `STEP ${step} / ${steps}`,
    spoken: (step, steps) => `Step ${step} of ${steps}`,
  },
  optional: "OPTIONAL",
  problems: (count) =>
    count === 1
      ? "1 answer needs attention."
      : `${count} answers need attention.`,
  choose: "Select",

  fields: {
    firstName: { label: "FIRST NAME", missing: "Enter your first name." },
    lastName: { label: "LAST NAME", missing: "Enter your last name." },
    // Any address, not only a company one: freelancers apply too.
    email: {
      label: "EMAIL",
      placeholder: "you@example.com",
      missing: "Enter your email.",
      invalid: "Enter an email like name@example.com.",
    },
    company: { label: "COMPANY", missing: "Enter your company." },
    role: { label: "YOUR ROLE", missing: "Enter your role." },
    companySize: {
      label: "COMPANY SIZE",
      missing: "Choose a company size.",
    },
    phone: {
      label: "PHONE",
      invalid: "Enter a number like +1 555 0100.",
    },
    goal: {
      label: "WHAT DO YOU WANT TO AUTOMATE?",
      placeholder: "e.g. answering customer emails, chasing invoices",
      missing: "Tell us what you'd like to automate.",
    },
  },

  companySizes: ["1–10", "11–50", "51–200", "201–1,000", "1,000+"],

  consent: {
    before: "I agree to the ",
    link: "Privacy Policy",
    after: ".",
    href: "/privacy",
    missing: "Agree to the Privacy Policy to submit.",
    opensInNewTab: "(opens in a new tab)",
  },
  marketing:
    "Email me about new AI systems, offers and discounts. Optional; unsubscribe any time.",

  actions: {
    continue: "CONTINUE",
    back: "BACK",
    submit: "SUBMIT APPLICATION",
  },

  success: {
    title: "Application received",
    body: (firstName) =>
      `Thanks, ${firstName}. What would you like to do next?`,
    marketplace: "EXPLORE THE MARKETPLACE",
    custom: "REQUEST A CUSTOM AI SYSTEM",
  },
};
