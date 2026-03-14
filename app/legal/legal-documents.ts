export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  summary: string;
  effectiveDate: string;
  lastUpdated: string;
  intro: string[];
  sections: LegalSection[];
  closing: string[];
  relatedLinks?: Array<{ label: string; href: string }>;
}

const legalProfile = {
  companyLegalName: 'Seven Labs LLC',
  platformName: 'Evento',
  platformUrl: 'https://app.evento.so',
  legalEmail: 'legal@evento.so',
  privacyEmail: 'privacy@evento.so',
  copyrightEmail: 'copyright@evento.so',
  legalNoticeAddress: 'Seven Labs LLC, Attn: Legal Notices, [INSERT MAILING ADDRESS]',
  copyrightAgentAddress: 'Seven Labs LLC, Attn: Copyright Agent, [INSERT MAILING ADDRESS]',
  governingLaw: 'the State of Delaware, USA',
  arbitrationProvider: 'JAMS',
  arbitrationRules: 'JAMS Streamlined Arbitration Rules',
  arbitrationVenue: 'Wilmington, Delaware',
} as const;

const termsOfService: LegalDocument = {
  title: 'Terms of Service',
  summary:
    'These Terms govern your access to and use of Evento, including all websites, applications, APIs, open-source repositories, and related services operated by Seven Labs LLC.',
  effectiveDate: 'February 25, 2026',
  lastUpdated: 'February 25, 2026',
  intro: [
    `${legalProfile.platformName} is an open-source events platform operated by ${legalProfile.companyLegalName}. These Terms of Service are a legally binding agreement between you and ${legalProfile.companyLegalName}.`,
    `By creating an account, accessing, browsing, contributing code, creating events, purchasing tickets, or otherwise using ${legalProfile.platformName} and related properties at ${legalProfile.platformUrl}, you agree to these Terms and our Privacy Policy.`,
    `If you do not agree, you must not use the Services. You may stop using the Services at any time, and we may suspend or terminate access at any time as described below.`,
  ],
  sections: [
    {
      title: '1. Definitions',
      paragraphs: [
        '"Services" means all Evento web and mobile applications, APIs, source code repositories, communication channels, support channels, and any features provided by Seven Labs LLC.',
        '"User Content" means any text, media, code, event information, profile data, messages, payment metadata, links, files, and other materials uploaded, submitted, or transmitted through the Services.',
      ],
      bullets: [
        '"Organizer" means a user who creates, manages, promotes, or hosts events.',
        '"Attendee" means a user who views, RSVPs to, attends, pays for, or interacts with events.',
        '"Third-Party Services" means payment providers, identity systems, analytics tools, hosting providers, messaging platforms, map providers, and similar external vendors.',
      ],
    },
    {
      title: '2. Eligibility and Account Responsibilities',
      paragraphs: [
        'You must be legally capable of entering into a binding contract and must comply with all laws applicable to your access and use of the Services.',
        'You are solely responsible for all activity that occurs under your account, whether authorized by you or not, and for safeguarding your credentials and devices.',
      ],
      bullets: [
        'You must provide accurate and current information and promptly update it when it changes.',
        'You may not share accounts, transfer accounts without written permission, or impersonate any person or entity.',
        `You must promptly notify us at ${legalProfile.legalEmail} of suspected unauthorized access or misuse.`,
      ],
    },
    {
      title: '3. At-Will Access and Open-Source Nature',
      paragraphs: [
        `${legalProfile.platformName} is offered on an at-will and as-available basis. We do not guarantee ongoing availability of any feature, repository, integration, endpoint, or account.`,
        `Open-source availability does not create any duty to maintain, support, or continue any specific module, API, release schedule, or compatibility commitment unless separately agreed in writing by ${legalProfile.companyLegalName}.`,
      ],
      bullets: [
        'You may stop using the Services at any time.',
        `We may modify, pause, discontinue, or remove any part of the Services, with or without notice, to the maximum extent allowed by law.`,
        'No oral or informal statements by us, contributors, or community members create binding commitments.',
      ],
    },
    {
      title: '4. Acceptable Use and Prohibited Conduct',
      paragraphs: [
        'You may use the Services only for lawful purposes and in compliance with these Terms, all posted policies, and all applicable local, state, national, and international laws and regulations.',
      ],
      bullets: [
        'Do not upload or distribute content that is unlawful, defamatory, infringing, deceptive, violent, hateful, exploitative, or sexually abusive.',
        'Do not facilitate scams, fake events, ticket fraud, phishing, malware, unauthorized fundraising, or payment abuse.',
        'Do not attempt unauthorized access, scraping in violation of our controls, reverse engineering for abuse, or interference with system integrity or security.',
        'Do not bypass moderation, safety controls, access restrictions, rate limits, or account actions.',
        'Do not use the Services to violate privacy, stalking, harassment, discrimination, trafficking, sanctions, export laws, or anti-corruption requirements.',
      ],
    },
    {
      title: '5. Organizer Obligations and Event Compliance',
      paragraphs: [
        'Organizers are solely responsible for event accuracy, legality, safety, permits, taxes, disclosures, refunds, venue compliance, and all organizer-attendee communications.',
        `${legalProfile.companyLegalName} is not the event organizer, seller, promoter, venue operator, transportation provider, security provider, or insurer unless expressly stated in writing for a specific event.`,
      ],
      bullets: [
        'Organizers must ensure event listings are truthful and not misleading.',
        'Organizers must secure required permissions, licenses, waivers, and age-gating where required by law.',
        'Organizers are solely responsible for physical safety plans, emergency response, and accessibility compliance for their events.',
      ],
    },
    {
      title: '6. User Content, License Grant, and Moderation Rights',
      paragraphs: [
        'You retain ownership of your User Content, but you grant Seven Labs LLC a worldwide, non-exclusive, royalty-free, sublicensable license to host, copy, store, process, adapt, display, perform, distribute, and otherwise use User Content as needed to operate, secure, improve, and promote the Services.',
        'You represent and warrant that you have all rights, permissions, and lawful bases needed to upload and use User Content and to grant the license above.',
      ],
      bullets: [
        'We may review, remove, restrict, or disable User Content and accounts at our sole discretion for legal, safety, platform integrity, or policy reasons.',
        'We have no obligation to publish, retain, or restore any User Content.',
        'You are solely responsible for backing up your own content.',
      ],
    },
    {
      title: '7. Intellectual Property and Open-Source Components',
      paragraphs: [
        `Except for your User Content and third-party materials, the Services and all associated marks, branding, product designs, and proprietary materials are owned by ${legalProfile.companyLegalName} or its licensors and are protected by law.`,
        'Open-source components are licensed under their respective licenses, which govern use of those components. In case of conflict between these Terms and an applicable open-source license for code covered by that license, the open-source license controls for that code only.',
      ],
      bullets: [
        `No rights are granted except as expressly provided in these Terms or applicable open-source licenses.`,
        'You may not use Evento or Seven Labs LLC names, logos, or marks in a way that implies endorsement without prior written permission.',
      ],
    },
    {
      title: '8. Copyright and IP Complaint Procedure',
      paragraphs: [
        'If you believe content on the Services infringes your copyright or other intellectual property rights, send a detailed notice to our designated contact with sufficient information for us to evaluate and respond.',
      ],
      bullets: [
        `Copyright reports: ${legalProfile.copyrightEmail}`,
        `Mail notices: ${legalProfile.copyrightAgentAddress}`,
        'Notices should include your contact details, a description of the work claimed to be infringed, location of the allegedly infringing material, a statement of good-faith belief, and a statement under penalty of perjury where required by applicable law.',
      ],
    },
    {
      title: '9. Fees, Third-Party Payments, and Financial Disclaimers',
      paragraphs: [
        'Certain Services may involve fees, paid features, subscriptions, payment processing, donations, contributions, tips, wallet features, or ticketing transactions handled by Third-Party Services.',
        `${legalProfile.companyLegalName} is not a bank, money transmitter, payment processor, escrow agent, broker, or fiduciary unless explicitly stated in a separate written agreement.`,
      ],
      bullets: [
        'You are responsible for all taxes, reporting obligations, and compliance associated with your transactions and event operations.',
        'Third-party processors may impose additional terms, fees, KYC checks, holds, or reversals outside our control.',
        'To the maximum extent allowed by law, all payment disputes between organizers and attendees are between those parties and relevant processors.',
      ],
    },
    {
      title: '10. Community Safety and No Duty to Monitor',
      paragraphs: [
        'We may implement trust and safety controls, but we do not guarantee that users, events, content, or interactions are safe, lawful, truthful, or suitable.',
        `You acknowledge that use of event platforms involves inherent risk, and you assume all risk arising from your participation in events and interactions initiated through ${legalProfile.platformName}.`,
      ],
      bullets: [
        'We do not perform universal background checks, identity verification, venue inspections, or safety certifications unless explicitly stated.',
        'Emergency situations should be reported to local emergency services first.',
      ],
    },
    {
      title: '11. Third-Party Services and External Links',
      paragraphs: [
        'The Services may integrate with or link to Third-Party Services. We do not control and are not responsible for third-party content, actions, security, policies, or availability.',
        'Your use of Third-Party Services is at your own risk and subject to those providers terms and privacy practices.',
      ],
      bullets: [
        'Third-party outages, policy changes, de-platforming, service failures, and data losses are outside our control.',
        `We disclaim liability for losses caused by third-party systems to the maximum extent permitted by law.`,
      ],
    },
    {
      title: '12. API, Automation, and Security Restrictions',
      paragraphs: [
        'Any API or automation access must follow our documentation, security controls, and technical limits. We may throttle, revoke, rotate, or terminate keys and integrations at any time.',
      ],
      bullets: [
        'No abusive traffic, denial-of-service behavior, credential stuffing, or unauthorized data harvesting.',
        'No use of bots or automation to manipulate ranking, inventory, attendance metrics, or platform integrity.',
        'You are responsible for securing your systems, API keys, and integration partners.',
      ],
    },
    {
      title: '13. Beta Features and Experimental Components',
      paragraphs: [
        'Some Services may be labeled beta, preview, experimental, or community-supported. These may be unstable and may change or be discontinued without notice.',
      ],
      bullets: [
        'Beta features are provided as-is, may include defects, and may not be covered by support.',
        'You should not rely on beta features for mission-critical workflows without independent safeguards.',
      ],
    },
    {
      title: '14. Termination, Suspension, and Enforcement',
      paragraphs: [
        `We may investigate violations and take enforcement actions including warnings, content removal, account restrictions, suspension, termination, legal hold, or cooperation with law enforcement as appropriate.`,
        'You may stop using the Services at any time. Termination does not relieve you of obligations that accrued before termination.',
      ],
      bullets: [
        'Sections that by nature should survive termination will survive, including ownership, disclaimers, limitation of liability, indemnity, dispute resolution, and other protective terms.',
      ],
    },
    {
      title: '15. Disclaimers of Warranties',
      paragraphs: [
        `To the maximum extent permitted by law, the Services are provided on an as-is and as-available basis without warranties of any kind, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, title, non-infringement, availability, reliability, accuracy, security, and error-free operation.`,
        `We do not warrant that the Services will be uninterrupted, timely, secure, or free from harmful components, or that defects will be corrected.`,
      ],
    },
    {
      title: '16. Limitation of Liability',
      paragraphs: [
        `To the maximum extent permitted by law, ${legalProfile.companyLegalName}, its affiliates, officers, directors, employees, contractors, contributors, licensors, and service providers will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenues, goodwill, data, opportunities, or business interruption arising out of or related to the Services.`,
        `To the maximum extent permitted by law, the aggregate liability of ${legalProfile.companyLegalName} for all claims relating to the Services will not exceed the greater of one hundred U.S. dollars (USD 100) or the amount you paid directly to ${legalProfile.companyLegalName} for the Services in the twelve (12) months before the event giving rise to liability.`,
      ],
      bullets: [
        'Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you to the extent prohibited by law.',
      ],
    },
    {
      title: '17. Indemnification and Release',
      paragraphs: [
        `You agree to defend, indemnify, and hold harmless ${legalProfile.companyLegalName} and its affiliates, officers, directors, employees, contractors, contributors, licensors, and service providers from and against any claims, losses, liabilities, damages, judgments, costs, and expenses (including reasonable attorneys fees) arising from or related to: (a) your use of the Services, (b) your User Content, (c) your events or transactions, (d) your violation of these Terms, or (e) your violation of law or third-party rights.`,
        'You release us from claims and disputes between users, organizers, attendees, vendors, and third parties, except to the extent such release is prohibited by applicable law.',
      ],
    },
    {
      title: '18. Compliance with Laws, Sanctions, and Export Controls',
      paragraphs: [
        'You may not use the Services in violation of sanctions, export controls, anti-money laundering rules, anti-corruption laws, consumer protection laws, or any other applicable legal requirements.',
      ],
      bullets: [
        'You represent that you are not located in, organized under, or ordinarily resident in a prohibited jurisdiction if such use is restricted by applicable law.',
        'You will not use the Services for prohibited end uses or with prohibited parties.',
      ],
    },
    {
      title: '19. Governing Law and Dispute Resolution',
      paragraphs: [
        `These Terms are governed by ${legalProfile.governingLaw}, excluding conflict-of-law principles.`,
        `Before filing a claim, you and ${legalProfile.companyLegalName} agree to attempt informal resolution by providing written notice to ${legalProfile.legalEmail} and allowing at least thirty (30) days to resolve the issue.`,
        `If unresolved, disputes will be finally resolved by binding arbitration administered by ${legalProfile.arbitrationProvider} under the ${legalProfile.arbitrationRules} in ${legalProfile.arbitrationVenue}, except where prohibited by law or where either party seeks eligible equitable relief in court.`,
      ],
      bullets: [
        'Disputes must be brought on an individual basis only, not as class, collective, representative, or private attorney general actions, to the maximum extent permitted by law.',
        'If any part of this arbitration or class action waiver section is found unenforceable, the unenforceable part will be severed and the remainder will remain in effect to the fullest extent allowed by law.',
      ],
    },
    {
      title: '20. Changes to the Services or Terms',
      paragraphs: [
        'We may update these Terms from time to time. The updated version will be posted with a new effective date. Material updates may be communicated through the Services or by other reasonable means.',
        'By continuing to use the Services after updated Terms become effective, you agree to the revised Terms.',
      ],
    },
    {
      title: '21. General Legal Terms',
      paragraphs: [
        'These Terms and any incorporated policies constitute the entire agreement between you and Seven Labs LLC regarding the Services and supersede prior or contemporaneous agreements on the same subject matter.',
      ],
      bullets: [
        `No waiver is effective unless in writing and signed by an authorized representative of ${legalProfile.companyLegalName}.`,
        'If any provision is held invalid or unenforceable, the remaining provisions remain in full force and effect.',
        'You may not assign these Terms without our prior written consent. We may assign these Terms in connection with a merger, reorganization, sale, or by operation of law.',
        'Nothing in these Terms creates a partnership, agency, fiduciary, employment, or joint venture relationship.',
      ],
    },
  ],
  closing: [
    `Legal contact: ${legalProfile.legalEmail}`,
    `Mailing address for legal notices: ${legalProfile.legalNoticeAddress}`,
    'If any required legal wording for your jurisdiction differs, local mandatory law will control to that extent.',
  ],
  relatedLinks: [{ label: 'Read Privacy Policy', href: '/privacy' }],
};

const privacyPolicy: LegalDocument = {
  title: 'Privacy Policy',
  summary:
    'This Privacy Policy explains how Seven Labs LLC collects, uses, discloses, and protects personal information in connection with Evento and related services.',
  effectiveDate: 'February 25, 2026',
  lastUpdated: 'February 25, 2026',
  intro: [
    `${legalProfile.companyLegalName} ("we", "us", "our") operates ${legalProfile.platformName}, an open-source events platform. This Privacy Policy describes how we process personal information when you use our Services.`,
    'By using the Services, you acknowledge the practices described in this Privacy Policy. If you do not agree, do not use the Services.',
    'This Privacy Policy does not cover information processed solely by event organizers, venues, payment providers, or other third parties acting as independent controllers or businesses.',
  ],
  sections: [
    {
      title: '1. Scope and Roles',
      paragraphs: [
        'This Privacy Policy applies to personal information processed through Evento websites, applications, APIs, support channels, and related communications.',
        'Depending on context, we may act as a controller, business, or processor/service provider. Event organizers and integrated third-party services may independently determine their own processing activities.',
      ],
    },
    {
      title: '2. Information We Collect',
      paragraphs: [
        'We collect information you provide directly, information collected automatically through use of the Services, and information received from third parties.',
      ],
      bullets: [
        'Account and profile information, such as name, username, email address, profile image, biography, and account preferences.',
        'Event and community information, such as event listings, RSVPs, ticketing metadata, invite lists, attendee interactions, organizer notes, and moderation history.',
        'Communications and support data, such as messages, feedback, abuse reports, and support requests.',
        'Transaction and billing metadata, such as payment status, processor references, refunds, chargebacks, and compliance flags from payment partners.',
        'Device and usage data, such as IP address, approximate location, browser and device identifiers, operating system, referral URLs, diagnostics, and interaction logs.',
      ],
    },
    {
      title: '3. Sources of Personal Information',
      paragraphs: [
        'We may obtain personal information from you, from your devices and browser, from event organizers and attendees, from integrated authentication and payment providers, and from anti-fraud or security partners.',
      ],
    },
    {
      title: '4. How We Use Personal Information',
      paragraphs: [
        'We use personal information to operate, maintain, secure, improve, and provide the Services, and to comply with legal obligations.',
      ],
      bullets: [
        'Provide core product functionality, account authentication, event workflows, and customer support.',
        'Personalize content, recommendations, and ranking signals based on platform activity and settings.',
        'Detect, investigate, and prevent fraud, abuse, security incidents, policy violations, and illegal activity.',
        'Process transactions, payouts, and records with third-party processors and financial partners.',
        'Perform analytics, debugging, quality assurance, and performance monitoring.',
        'Send transactional, service, legal, and policy-related communications.',
      ],
    },
    {
      title: '5. Legal Bases for Processing (Where Applicable)',
      paragraphs: [
        'Where required by law, we rely on one or more legal bases, including contract necessity, legitimate interests, legal obligation, consent, and protection of vital interests.',
        'When consent is required, you may withdraw consent at any time, subject to lawful processing already performed and technical or legal limitations.',
      ],
    },
    {
      title: '6. Cookies and Similar Technologies',
      paragraphs: [
        'We and our partners may use cookies, SDKs, local storage, pixels, and similar technologies to remember preferences, keep you signed in, measure usage, prevent abuse, and improve performance.',
      ],
      bullets: [
        'Essential technologies are used for security, authentication, and core site operation.',
        'Analytics technologies help us understand feature usage and reliability trends.',
        'You may control cookies through browser settings, but disabling certain technologies may limit functionality.',
      ],
    },
    {
      title: '7. Public Content and Open Platform Visibility',
      paragraphs: [
        'Certain profile fields, event details, comments, attendance indicators, and organizer content may be visible to other users or publicly accessible depending on feature settings and event privacy configuration.',
        'Content posted in public areas may be copied, indexed, reshared, or retained by other parties outside our control.',
      ],
      bullets: [
        'Do not post sensitive personal information in public fields.',
        'Organizers are responsible for configuring event visibility and attendee disclosures in compliance with applicable law.',
      ],
    },
    {
      title: '8. How We Share Information',
      paragraphs: [
        'We may share personal information as reasonably necessary to provide and secure the Services and to comply with law.',
      ],
      bullets: [
        'With service providers and vendors that support hosting, analytics, communications, security, customer support, and infrastructure.',
        'With event organizers, attendees, and communities when required by the relevant product feature or transaction flow.',
        'With payment processors, compliance providers, and financial partners for transaction handling and fraud prevention.',
        'With legal authorities, regulators, and law enforcement when required by law or when necessary to protect rights, safety, and platform integrity.',
        'In connection with mergers, acquisitions, financing, reorganization, bankruptcy, asset sales, or similar corporate transactions.',
      ],
    },
    {
      title: '9. Third-Party Services and Links',
      paragraphs: [
        'The Services may include links to or integrations with third-party services. Their privacy practices are governed by their own policies, not this Privacy Policy.',
        'We are not responsible for the content, security, or privacy practices of third-party services.',
      ],
    },
    {
      title: '10. International Data Transfers',
      paragraphs: [
        'We may process and store information in the United States and other jurisdictions where we or our service providers operate. Data protection laws in these jurisdictions may differ from those in your region.',
        'Where required, we use lawful transfer mechanisms and contractual safeguards for cross-border data transfers.',
      ],
    },
    {
      title: '11. Data Retention',
      paragraphs: [
        'We retain personal information for as long as reasonably necessary for the purposes described in this Privacy Policy, including service operation, compliance, dispute resolution, fraud prevention, and enforcement of legal rights.',
      ],
      bullets: [
        'Retention periods vary based on data category, legal requirements, account status, and risk signals.',
        'We may retain certain data in backup, audit, and legal hold systems for legitimate legal or security purposes.',
      ],
    },
    {
      title: '12. Data Security',
      paragraphs: [
        'We implement administrative, technical, and organizational safeguards designed to protect personal information against unauthorized access, loss, misuse, and alteration.',
        'No system is completely secure. You are responsible for securing your credentials, devices, and account access methods.',
      ],
      bullets: [
        `If you believe your account or data may be compromised, contact us immediately at ${legalProfile.legalEmail}.`,
      ],
    },
    {
      title: '13. Your Privacy Rights and Choices',
      paragraphs: [
        'Depending on your location, you may have rights to access, correct, delete, restrict, or object to processing of your personal information, and to request portability of certain data.',
      ],
      bullets: [
        `To submit rights requests, contact ${legalProfile.privacyEmail}. We may verify identity and authority before acting on a request.`,
        'You may have a right to appeal certain request decisions where provided by law.',
        'We will not discriminate against you for exercising privacy rights as prohibited by applicable law.',
      ],
    },
    {
      title: '14. U.S. State Privacy Disclosures',
      paragraphs: [
        'For residents of U.S. states with privacy laws, we describe categories of personal information collected, purposes of use, categories of recipients, and rights request methods in this Privacy Policy.',
        'We do not sell personal information for money in the traditional sense. If a data transfer qualifies as a sale or sharing under applicable law, you may exercise opt-out rights by contacting us.',
      ],
    },
    {
      title: '15. EEA, UK, and Similar Region Disclosures',
      paragraphs: [
        'If you are in the EEA, UK, or similar jurisdictions, you may have rights to lodge complaints with a supervisory authority and may request information about legal bases and transfer safeguards used for your personal information.',
      ],
    },
    {
      title: '16. Minors',
      paragraphs: [
        'The Services are not directed to children under 13 (or older minimum age where required by local law). If we learn that we collected personal information from a child in violation of law, we will take appropriate action, which may include account removal and deletion of related data.',
      ],
    },
    {
      title: '17. Do Not Track and Global Privacy Signals',
      paragraphs: [
        'Some browsers and extensions transmit do-not-track or global privacy preference signals. Because standards are evolving, we may not respond to all such signals in every context. Where legally required, we will apply required opt-out preferences.',
      ],
    },
    {
      title: '18. Changes to This Privacy Policy',
      paragraphs: [
        'We may update this Privacy Policy periodically. We will post the updated version and revise the effective date. Material updates may be communicated through the Services or by other reasonable means.',
      ],
    },
    {
      title: '19. Contact Information',
      paragraphs: [
        `Privacy contact: ${legalProfile.privacyEmail}`,
        `General legal contact: ${legalProfile.legalEmail}`,
        `Mailing address: ${legalProfile.legalNoticeAddress}`,
      ],
    },
  ],
  closing: [
    'If you are an organizer, you may have separate privacy obligations to attendees and must provide your own compliant notices where required by law.',
    'This Privacy Policy is intended to be transparent and practical, but it is not legal advice for your independent business obligations.',
  ],
  relatedLinks: [{ label: 'Read Terms of Service', href: '/terms' }],
};

export const legalDocuments = {
  terms: termsOfService,
  privacy: privacyPolicy,
};
