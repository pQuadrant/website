import type { PrivacyContent } from "@/content/types";

/**
 * The privacy policy, shown at `/privacy`. Linked only from the apply form's
 * consent checkbox, never from the chrome or a footer, by the product owner's
 * decision.
 *
 * It describes what the site does with personal information, so it has to
 * change whenever that does: when applications start being stored, when email
 * codes, bot protection, booking or cookies are added, and when a new service
 * provider receives data. Change "updated" with it. It was written to meet the
 * common requirements of the UAE, Egyptian, Saudi, EU and UK data protection
 * laws and US state privacy laws, and has not been reviewed by a lawyer.
 * See Privacy policy in `codebase-map/content.md`.
 */

const CONTACT = "abdulrahmankeshta@pquadrant.com";

export const privacyContent: PrivacyContent = {
  title: "Privacy Policy",
  updated: "LAST UPDATED 18 OCTOBER 2026",
  contactEmail: CONTACT,
  contentsLabel: "Contents",

  intro: [
    "pQuadrant (“we”, “us”) builds AI systems (automations, agents and Artificial Employees) that help businesses carry out work. This policy explains what personal information we collect through pquadrant.com, why we collect it, who we share it with, and the choices and rights you have.",
    `pQuadrant is registered in Dubai, United Arab Emirates, and is responsible for your personal information as its controller. If you have a question or a request, write to ${CONTACT}.`,
  ],

  sections: [
    {
      heading: "What we collect",
      blocks: [
        "Information you give us when you apply for access:",
        {
          list: [
            "Your first and last name, email address, company and role.",
            "Your company’s size, and your phone number if you choose to give it.",
            "What you would like to automate, in your own words.",
            "That you agreed to this policy, and when.",
          ],
        },
        "Information you give us when you write to us or meet with us, such as during a guided demo: your contact details and what you tell us.",
        "Technical information our hosting provider processes automatically to deliver the site and keep it secure, such as your IP address, browser type and the pages requested.",
        "Please do not include sensitive information in your application, such as health, financial account or government identity details. We do not need it.",
      ],
    },
    {
      heading: "How we use it",
      blocks: [
        {
          list: [
            "To respond to your application and arrange guided demos of the AI systems you are interested in.",
            "To discuss, scope and provide any custom AI system you ask us about.",
            "To keep a record of your application and our conversations, including which systems we have demonstrated to you and how often.",
            "To understand which systems are in demand and improve what we offer.",
            "To keep the site secure and protect it from spam and abuse.",
            "To meet our legal obligations.",
          ],
        },
        "We do not sell your personal information, and we do not use it for advertising. We do not make decisions about you based solely on automated processing that have legal or similarly significant effects on you.",
      ],
    },
    {
      heading: "Our legal bases",
      blocks: [
        "Where the law asks us to name a legal basis for using your information, such as in the European Union and the United Kingdom, we rely on:",
        {
          list: [
            "Taking steps you ask for before entering into a contract with us, such as reviewing your application and arranging a demo.",
            "Our legitimate interests in running and securing our business and the site, and in following up with you about the services you asked about. We balance these against your rights.",
            "Your consent, where the law requires it, such as for marketing emails. You can withdraw consent at any time.",
            "Compliance with legal obligations.",
          ],
        },
      ],
    },
    {
      heading: "Marketing",
      blocks: [
        "We will not send you newsletters or promotional emails unless you have agreed to receive them, where the law requires your agreement. Every marketing email will include a way to unsubscribe. Messages about your application or a demo you have arranged are not marketing.",
      ],
    },
    {
      heading: "Who we share it with",
      blocks: [
        {
          list: [
            "Service providers who help us run the site and our business, such as cloud hosting and storage (Amazon Web Services), email delivery, scheduling, and spam and bot protection. They may use your information only to provide their services to us, under contract.",
            "Professional advisers, such as lawyers and accountants, where needed.",
            "Authorities, where the law requires it or to protect our rights or the safety of others.",
            "A buyer or successor, if our business is reorganised, merged or sold. They would remain bound by this policy.",
          ],
        },
        "We do not sell or rent your personal information to anyone.",
      ],
    },
    {
      heading: "Where your information is stored",
      blocks: [
        "We are based in the United Arab Emirates and work with businesses internationally. We store the information you give us with Amazon Web Services in the European Union (Stockholm, Sweden). It may be accessed from the United Arab Emirates and other countries where we or our service providers operate.",
        "When your information moves between countries, we protect it as the law of the country it leaves requires, for example with contractual safeguards.",
      ],
    },
    {
      heading: "How long we keep it",
      blocks: [
        "We keep your application and our records of our conversations while we are in discussion with you, and for up to two years after we were last in contact. We then delete it or make it anonymous. If you become a customer, it becomes part of your customer record and is kept for as long as our agreement and the law require.",
        "Technical logs are kept for a limited period, for security.",
      ],
    },
    {
      heading: "How we protect it",
      blocks: [
        "We use technical and organisational measures suited to the risk, including encryption in transit and at rest, and access limited to the people who need it. No system is completely secure. If a breach affects your information, we will notify you and the relevant authorities where the law requires it.",
      ],
    },
    {
      heading: "Your rights",
      blocks: [
        "Depending on where you live, you may have the right to:",
        {
          list: [
            "Find out whether we hold information about you, and get a copy of it.",
            "Have inaccurate information corrected.",
            "Have your information deleted.",
            "Object to, or ask us to restrict, how we use it.",
            "Receive the information you gave us in a portable format.",
            "Withdraw your consent, where we rely on it.",
            "Not be treated differently for exercising any of these rights.",
          ],
        },
        `To make a request, write to ${CONTACT}. We may ask you to confirm your identity first. We will reply within 30 days, or sooner where the law requires.`,
        "You can also complain to a data protection authority, such as the UAE Data Office, Egypt’s Personal Data Protection Center, the Saudi Data and Artificial Intelligence Authority (SDAIA), a supervisory authority in the European Union, or the Information Commissioner’s Office in the United Kingdom. We would appreciate the chance to resolve your concern first.",
      ],
    },
    {
      heading: "Cookies",
      blocks: [
        "The site does not use cookies or similar technologies, for analytics, advertising or anything else. If we add any, we will update this policy first and ask for your consent where the law requires it.",
      ],
    },
    {
      heading: "Children",
      blocks: [
        "Our services are for businesses and are not directed at anyone under 18. We do not knowingly collect information from children.",
      ],
    },
    {
      heading: "Changes to this policy",
      blocks: [
        "We may update this policy as our services change. We will change the date at the top, and tell applicants by email about significant changes.",
      ],
    },
    {
      heading: "Contact",
      blocks: [
        `pQuadrant, Dubai, United Arab Emirates. Write to ${CONTACT} with any question or request about your personal information.`,
      ],
    },
  ],
};
