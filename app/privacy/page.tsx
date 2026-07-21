import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy — Predifi",
  description: "How Predifi collects, uses, and protects your personal information.",
  alternates: {
    canonical: "https://predifi.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy — Predifi",
    description: "How Predifi collects, uses, and protects your personal information.",
    url: "https://predifi.com/privacy",
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
          <Image src="/assets/logo-icon-dark.png" alt="Predifi" width={28} height={28} className="h-7 w-auto" />
          <span className="text-foreground text-xs uppercase tracking-[0.22em] font-medium">Predifi</span>
        </Link>
        <Link href="/" className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </Link>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Legal</p>
          <h1 className="text-4xl font-bold uppercase tracking-[0.06em] mb-3">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Last Updated: March 20, 2026</p>
        </div>

        <div className="space-y-12 text-sm leading-[1.8]">

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Introduction</h2>
            <p className="text-foreground/80 mb-4">
              Predifi Labs (&quot;the Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy (the &quot;Policy&quot;) describes how we collect, use, disclose, and safeguard personal information through our digital properties — including <strong>predifi.com</strong>, <strong>app.predifi.com</strong>, the Predifi decentralized prediction market platform, associated API services, social media pages, marketing communications, and any other services referencing this Policy (collectively, the &quot;Services&quot;). Capitalized terms not defined herein are defined in our Terms of Service.
            </p>
            <p className="text-foreground/80 mb-4">
              This Policy does not apply to personal data relating to the Company&apos;s employees, contractors, or candidates.
            </p>
            <p className="text-foreground/80">
              Please read this Policy carefully before using the Services. If you do not agree with the practices described herein, you should discontinue use. We may update this Policy from time to time; continued use of the Services after any update constitutes acceptance of the revised Policy. Where required by applicable law, we will notify you of material changes.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Information We Collect</h2>

            <h3 className="font-semibold mb-2 text-foreground">Information You Provide Directly</h3>
            <p className="text-foreground/80 mb-4">
              Certain features of our Services require you to provide specific information. While you may choose not to provide it, this may restrict your ability to access or use certain features. Information you may provide includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70 mb-6">
              <li><strong className="text-foreground/90">Contact and identity information:</strong> Name, email address, and similar identifiers when you register for the waitlist, create an account, or contact us.</li>
              <li><strong className="text-foreground/90">Profile information:</strong> Username, account creation date, preferences, participation in promotions or surveys, and other details you add to your profile.</li>
              <li><strong className="text-foreground/90">Communication information:</strong> Records of communications with us through any channel, including support requests, feedback, and social media interactions.</li>
              <li><strong className="text-foreground/90">Marketing preferences:</strong> Your preferences regarding receipt of marketing communications and your engagement with such communications.</li>
              <li><strong className="text-foreground/90">Financial and wallet information:</strong> When you connect a self-hosted cryptocurrency wallet to our Platform, we receive your public wallet address and on-chain transaction data associated with your use of the Platform. We do not have access to your private keys or the ability to initiate transactions on your behalf. If you make payments for subscriptions or other services, payment card or bank information is collected and processed by our third-party payment processors; we do not store full payment card details.</li>
              <li><strong className="text-foreground/90">Other information:</strong> Any additional data you choose to provide through the Services.</li>
            </ul>

            <h3 className="font-semibold mb-2 text-foreground">Information From Third-Party Sources</h3>
            <p className="text-foreground/80 mb-4">
              We may receive personal information about you from third parties, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70 mb-6">
              <li>Social media platforms and login integration partners, when you authenticate through a third-party provider.</li>
              <li>Marketing and analytics partners who supplement our data with publicly available or legitimately obtained information.</li>
              <li>On-chain data sources and blockchain analytics providers.</li>
            </ul>

            <h3 className="font-semibold mb-2 text-foreground">Information Collected Automatically</h3>
            <p className="text-foreground/80 mb-4">
              We and our service providers automatically collect information when you access or use the Services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70 mb-6">
              <li><strong className="text-foreground/90">Device and technical data:</strong> IP address, browser type and version, operating system, device type, unique device identifiers, screen resolution, and language settings.</li>
              <li><strong className="text-foreground/90">Usage data:</strong> Pages and features accessed, session duration, navigation paths, clicks, referral URLs, and access timestamps.</li>
              <li><strong className="text-foreground/90">Communication interaction data:</strong> Whether you open, forward, or click links within our email communications.</li>
              <li><strong className="text-foreground/90">On-chain activity:</strong> Publicly available blockchain transaction data associated with your wallet address when you interact with Predifi smart contracts.</li>
            </ul>

            <h3 className="font-semibold mb-2 text-foreground">Cookies and Tracking Technologies</h3>
            <p className="text-foreground/80">
              We use cookies, local storage, pixel tags, and similar technologies to operate and improve the Services. These include session cookies (deleted when your session ends), persistent cookies, first-party cookies, and third-party cookies placed by our analytics and advertising partners. Most browsers allow you to control cookies through settings; disabling cookies may affect your use of the Services. We do not currently respond to &quot;Do Not Track&quot; browser signals.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">How We Use Your Information</h2>
            <p className="text-foreground/80 mb-4">We use personal information for the following purposes or as otherwise described at the time of collection:</p>
            <ul className="list-disc pl-5 space-y-3 text-foreground/70">
              <li><strong className="text-foreground/90">Service delivery and operations:</strong> Providing, operating, and improving the Platform; processing transactions; establishing and maintaining user profiles; enabling user-to-user interactions; sending service-related communications and security notifications.</li>
              <li><strong className="text-foreground/90">Personalization:</strong> Customizing your experience based on your preferences, trading history, and activity on the Platform.</li>
              <li><strong className="text-foreground/90">Research and development:</strong> Analyzing usage patterns to develop new features, improve existing functionality, and optimize performance. This may include training internal machine learning models on anonymized or aggregated data.</li>
              <li><strong className="text-foreground/90">Marketing and communications:</strong> Sending marketing emails and product updates where you have opted in or where permitted by law. You may opt out of marketing communications at any time by using the unsubscribe link in any such communication or contacting us directly. Opting out does not affect service-related communications.</li>
              <li><strong className="text-foreground/90">Interest-based advertising:</strong> Working with third-party advertising partners who may use cookies and similar technologies to serve you targeted ads across other online services based on your interactions with our Services.</li>
              <li><strong className="text-foreground/90">Analytics and improvement:</strong> Understanding how users interact with the Services, identifying most and least used features, and improving the overall user experience.</li>
              <li><strong className="text-foreground/90">Compliance and protection:</strong> Complying with applicable laws and legal processes; responding to regulatory inquiries and law enforcement requests; protecting the rights, privacy, safety, and property of the Company and its users; detecting and preventing fraud, abuse, and unauthorized access; enforcing our Terms of Service.</li>
              <li><strong className="text-foreground/90">De-identified and aggregated data:</strong> We may de-identify or aggregate personal information so that it no longer identifies any individual, and use such data for any lawful business purpose including research, analytics, and improving the Platform. We maintain de-identified data in de-identified form and do not attempt to re-identify it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">How We Disclose Your Information</h2>
            <p className="text-foreground/80 mb-4">We may disclose your personal information to the following parties:</p>
            <ul className="list-disc pl-5 space-y-3 text-foreground/70">
              <li><strong className="text-foreground/90">Affiliates:</strong> Our corporate parent, subsidiaries, and affiliates, for purposes consistent with this Policy.</li>
              <li><strong className="text-foreground/90">Service providers:</strong> Third parties that provide services on our behalf, including cloud hosting, infrastructure, analytics, email delivery, marketing automation, fraud prevention, and customer support. These parties are contractually obligated to use your data only as directed by us.</li>
              <li><strong className="text-foreground/90">Payment processors:</strong> Trusted third-party payment processors who handle financial transactions. We do not store complete payment card data.</li>
              <li><strong className="text-foreground/90">Blockchain infrastructure:</strong> By design, transactions on Hedera and other public blockchains are publicly visible and immutable. Information recorded on-chain is outside our control once submitted.</li>
              <li><strong className="text-foreground/90">Advertising partners:</strong> Third-party advertising companies for interest-based advertising purposes described above, subject to applicable privacy laws.</li>
              <li><strong className="text-foreground/90">Third parties you designate:</strong> When you authorize a connection between your account and a third-party service, platform, or wallet provider.</li>
              <li><strong className="text-foreground/90">Professional advisors:</strong> Lawyers, auditors, bankers, and insurers, to the extent required in the course of professional services they provide to us.</li>
              <li><strong className="text-foreground/90">Legal and regulatory authorities:</strong> Law enforcement, government authorities, and courts as required by law or as we believe in good faith is necessary to comply with legal processes, protect rights, or prevent fraud or harm.</li>
              <li><strong className="text-foreground/90">Business transferees:</strong> In connection with actual or prospective business transactions — including mergers, acquisitions, asset sales, investments, or restructuring — personal information may be transferred as a business asset, subject to appropriate confidentiality obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Data Retention</h2>
            <p className="text-foreground/80">
              We retain personal information for as long as necessary to fulfill the purposes for which it was collected, including meeting legal, accounting, and reporting obligations, establishing or defending legal claims, and preventing fraud. When determining retention periods, we consider the nature and sensitivity of the data, the potential risk of harm from unauthorized use or disclosure, the purposes of processing, and applicable legal requirements. Aggregated and de-identified data may be retained indefinitely. Upon your request to delete your account or data, we will take commercially reasonable steps to respond within the timeframes required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Third-Party Sites and Services</h2>
            <p className="text-foreground/80">
              Our Services may contain links to or integrations with third-party websites, applications, and services not operated by us. We are not responsible for the privacy practices of these third parties, and this Policy does not apply to their services. We encourage you to review the privacy policies of any third-party services you access.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Security</h2>
            <p className="text-foreground/80">
              We implement commercially reasonable technical, administrative, and organizational security measures designed to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These include encryption in transit and at rest, access controls, and regular security assessments. However, no system is completely secure, and we cannot guarantee the absolute security of your information. You are responsible for securing your wallet credentials, private keys, and passwords, which we cannot access or recover on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">International Data Transfers</h2>
            <p className="text-foreground/80">
              Your personal information may be transferred to and processed in countries other than your country of residence, including countries whose privacy laws may not provide the same level of protection as those in your jurisdiction. By using the Services, you consent to such transfers. Where required, we implement appropriate safeguards for cross-border data transfers, such as standard contractual clauses.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Children</h2>
            <p className="text-foreground/80">
              Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you are a parent or guardian and believe your child has provided us with personal information in violation of applicable law, please contact us and we will take commercially reasonable steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Your Rights and Choices</h2>
            <p className="text-foreground/80 mb-4">
              Depending on your jurisdiction, you may have certain rights with respect to your personal information, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70 mb-4">
              <li><strong className="text-foreground/90">Right to access:</strong> Request information about the personal data we hold about you and how it is used.</li>
              <li><strong className="text-foreground/90">Right to deletion:</strong> Request that we delete your personal information, subject to certain exceptions required by law.</li>
              <li><strong className="text-foreground/90">Right to correction:</strong> Request correction of inaccurate or incomplete personal information.</li>
              <li><strong className="text-foreground/90">Right to opt out of marketing:</strong> Unsubscribe from marketing communications at any time via the link in any email or by contacting us.</li>
              <li><strong className="text-foreground/90">Right to opt out of targeted advertising:</strong> You may opt out of interest-based advertising through your browser settings, device settings, or industry opt-out tools.</li>
              <li><strong className="text-foreground/90">Right to data portability:</strong> Where applicable under law, request a copy of your data in a portable format.</li>
            </ul>
            <p className="text-foreground/80">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:privacy@predifi.com" className="text-foreground underline hover:text-amber-400 transition-colors">privacy@predifi.com</a>.
              We may need to verify your identity before processing your request and will respond within applicable legal timeframes. We will not discriminate against you for exercising your rights. If we deny your request, you retain the right to appeal.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">California and U.S. State Residents</h2>
            <p className="text-foreground/80 mb-4">
              If you are a resident of California or another U.S. state with a comprehensive privacy law (including but not limited to the CCPA/CPRA, Colorado CPA, Virginia CDPA, and similar statutes), this section provides additional disclosures. For purposes of this section, &quot;personal information&quot; includes &quot;sensitive personal information&quot; as defined under applicable law.
            </p>
            <p className="text-foreground/80 mb-4">
              In the preceding 12 months, we have collected the following categories of personal information: (1) identifiers (name, email address, IP address, device identifiers); (2) commercial information (subscription and transaction history); (3) internet and network activity (interactions with the Services); (4) geolocation data (derived from IP address); (5) account credentials (username and password). We collect this information from sources described above, for the purposes described above.
            </p>
            <p className="text-foreground/80">
              We do not &quot;sell&quot; or &quot;share&quot; personal information as those terms are defined under the CCPA, and we do not have knowledge of selling or sharing personal information of individuals under 18. California residents under 18 who have posted content to the Services may request removal by contacting us directly. We will make commercially reasonable efforts to comply with such requests, subject to applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Changes to This Policy</h2>
            <p className="text-foreground/80">
              We may update this Policy from time to time. When we do, we will update the &quot;Last Updated&quot; date above and post the revised Policy on this page. For material changes, we will provide additional notice as required by applicable law (such as an email notification or a prominent notice on our Services prior to the change becoming effective). Your continued use of the Services after any changes constitutes acceptance of the revised Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">Contact Us</h2>
            <p className="text-foreground/80">
              If you have any questions, concerns, or requests relating to this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 border border-border rounded text-foreground/70">
              <p className="font-medium text-foreground mb-1">Predifi Labs</p>
              <p>Email: <a href="mailto:privacy@predifi.com" className="text-foreground underline hover:text-amber-400 transition-colors">privacy@predifi.com</a></p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-border mt-16 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground uppercase tracking-[0.12em]">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/tos" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="text-foreground">Privacy Policy</Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/50 uppercase tracking-[0.08em]">© 2026 Predifi Labs. All rights reserved.</p>
      </footer>
    </div>
  );
}
