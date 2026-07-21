import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Terms of Service — Predifi",
  description: "The terms and conditions governing your use of the Predifi prediction market platform.",
  alternates: {
    canonical: "https://predifi.com/tos",
  },
  openGraph: {
    title: "Terms of Service — Predifi",
    description: "The terms and conditions governing your use of the Predifi prediction market platform.",
    url: "https://predifi.com/tos",
  },
};

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold uppercase tracking-[0.06em] mb-3">Terms of Service</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">Last Updated: March 20, 2026</p>
        </div>

        <div className="space-y-12 text-sm leading-[1.8]">

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">1. Introduction and Acceptance</h2>
            <p className="text-foreground/80 mb-4">
              These Terms of Service (the &quot;Terms&quot;) are entered into between you (&quot;you,&quot; &quot;your,&quot; or &quot;User&quot;) and Predifi Labs (&quot;the Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) and govern your access to and use of:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70 mb-4">
              <li>The <strong className="text-foreground/90">predifi.com</strong> marketing site and all informational content available thereon (the &quot;Site&quot;);</li>
              <li>The <strong className="text-foreground/90">app.predifi.com</strong> decentralized prediction market application and associated software (the &quot;Platform&quot;); and</li>
              <li>All other features, tooling, APIs, documentation, and services that link to or incorporate these Terms (collectively, the &quot;Services&quot;).</li>
            </ul>
            <p className="text-foreground/80 mb-4">
              These Terms, together with our Privacy Policy and any supplemental terms or policies that expressly incorporate these Terms, constitute the entire and binding agreement between you and the Company.
            </p>
            <p className="text-foreground/80 font-medium">
              BY ACCESSING, INTERACTING WITH, OR USING ANY PART OF THE SERVICES — INCLUDING BY CONNECTING A WALLET, JOINING THE WAITLIST, OR VISITING THE SITE — YOU CONFIRM THAT YOU ARE OF LEGAL AGE, HAVE READ AND UNDERSTOOD THESE TERMS, AND AGREE TO BE LEGALLY BOUND BY THEM. IF YOU DO NOT AGREE, YOU ARE NOT AUTHORIZED TO USE THE SERVICES.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">2. Description of Services</h2>
            <p className="text-foreground/80 mb-4">
              Predifi is a decentralized prediction market protocol built on the Hedera network. The Platform enables eligible users to participate in prediction markets by staking cryptocurrency on the outcomes of real-world events (&quot;Prediction Markets&quot;). All Prediction Markets are based on objectively verifiable events resolved through designated third-party oracle sources (&quot;Oracle Sources&quot;).
            </p>
            <p className="text-foreground/80 mb-4">
              The Company reserves the sole discretion to determine which Oracle Sources are used for market resolution, which event categories are permissible, and when to modify, suspend, or terminate any market. Once a market outcome is determined from the designated Oracle Source, that outcome is final and binding.
            </p>
            <p className="text-foreground/80 mb-4">
              The Site primarily provides informational content — including the Predifi World Index (&quot;PWI&quot;), blog content, and product information. Informational content is not financial advice, and the Company is not acting as an investment adviser, trading adviser, tax adviser, legal adviser, or fiduciary in any capacity.
            </p>
            <p className="text-foreground/80 mb-4">
              You acknowledge that: (a) the Company does not control, transmit to, or have access to any blockchain network; (b) the Company has no custody of your cryptoassets at any time; (c) the Company cannot reverse, modify, or recover any on-chain transaction; and (d) you are solely responsible for all wallet configuration, private key management, and transaction review before submission.
            </p>
            <p className="text-foreground/80">
              From time to time the Services may be unavailable due to maintenance, technical issues, third-party service disruptions, blockchain infrastructure downtime, or events beyond our control. The Company will not be liable for any losses resulting from such unavailability.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">3. Modifications</h2>
            <p className="text-foreground/80 mb-4">
              <span className="font-medium text-foreground">To the Terms:</span> We reserve the right to modify these Terms at any time at our sole discretion. Modified Terms will be posted with an updated &quot;Last Updated&quot; date. Your continued use of the Services after any modification constitutes acceptance of the revised Terms. It is your responsibility to review these Terms periodically.
            </p>
            <p className="text-foreground/80">
              <span className="font-medium text-foreground">To the Services:</span> We reserve the right to modify, add, remove, restrict, or discontinue any feature, content, or part of the Services at any time, with or without notice. We are not liable for any losses resulting from modifications, suspensions, or discontinuations of the Services or your access thereto.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">4. Eligibility, Representations, and Restricted Persons</h2>

            <h3 className="font-semibold mb-2 text-foreground">Age and Authority</h3>
            <p className="text-foreground/80 mb-4">
              The Services are intended solely for users who are 18 years of age or older. If you are accessing the Services on behalf of an entity, you represent that you have the legal authority to bind that entity to these Terms.
            </p>

            <h3 className="font-semibold mb-2 text-foreground">Restricted Jurisdictions</h3>
            <p className="text-foreground/80 mb-4">
              ACCESS TO AND USE OF THE PLATFORM AND TECHNOLOGY FEATURES IS NOT PERMITTED AND IS EXPRESSLY PROHIBITED FOR ANY PERSON OR ENTITY (&quot;RESTRICTED PERSON&quot;) WHO:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70 mb-4">
              <li>Resides in, is located in, is incorporated in, or has a registered office or principal place of business in any Restricted Jurisdiction; or</li>
              <li>Is using the Services on behalf of, at the direction of, or for the benefit of any Restricted Person.</li>
            </ul>
            <p className="text-foreground/80 mb-4">
              &quot;Restricted Jurisdictions&quot; include: the United States of America (including all its territories and possessions, and any U.S. Person as defined under applicable U.S. law); the United Kingdom; the Cayman Islands; any jurisdiction subject to comprehensive economic sanctions administered by the United States, the United Nations, or the European Union (including Iran, Syria, Cuba, North Korea, Russia, and the Crimea, Donetsk, and Luhansk regions of Ukraine); and any other jurisdiction where the use of the Platform would violate Applicable Laws (as defined below) or as otherwise designated by the Company at its sole discretion.
            </p>
            <p className="text-foreground/80 mb-4 font-medium">
              USE OF A VPN OR ANY TOOL TO CIRCUMVENT GEOGRAPHIC RESTRICTIONS IS STRICTLY PROHIBITED. VIOLATIONS MAY RESULT IN PERMANENT SUSPENSION OF ACCESS.
            </p>

            <h3 className="font-semibold mb-2 text-foreground">Sanctions Compliance</h3>
            <p className="text-foreground/80 mb-4">
              You represent and warrant that you are not, and will not become during your use of the Services: (i) subject to any economic or trade sanctions; (ii) listed on OFAC&apos;s SDN list or any equivalent EU, UK, or UN sanctions list; or (iii) acting for or on behalf of any sanctioned party.
            </p>

            <h3 className="font-semibold mb-2 text-foreground">Additional Representations</h3>
            <p className="text-foreground/80 mb-2">By using the Services, you represent and warrant that:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70">
              <li>Your use of the Services does not violate any Applicable Laws in your jurisdiction;</li>
              <li>You possess sufficient knowledge, sophistication, and experience to understand blockchain technology, cryptoassets, and the risks of participation in prediction markets;</li>
              <li>You are solely responsible for configuring and securing your wallet, private keys, and credentials;</li>
              <li>You will not use a VPN or similar tool to circumvent any restriction applicable to the Services; and</li>
              <li>All information you provide to us is accurate and not misleading.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">5. Financial Risks and Market Participation</h2>
            <p className="text-foreground/80 mb-4">
              PARTICIPATION IN PREDICTION MARKETS INVOLVES SUBSTANTIAL FINANCIAL RISK. YOU MAY LOSE UP TO THE ENTIRE AMOUNT OF CRYPTOASSETS YOU COMMIT TO ANY PREDICTION MARKET. Past performance of any market is not indicative of future results.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70 mb-4">
              <li>All on-chain transactions are irreversible, final, and there are no refunds;</li>
              <li>Cryptoasset values are highly volatile;</li>
              <li>The Company does not guarantee the accuracy of Oracle Sources or the outcome of any Prediction Market;</li>
              <li>Technical delays, smart contract bugs, network congestion, or oracle failures may affect market resolution;</li>
              <li>The Company is not responsible for the resolution of any Prediction Market or any disputes related thereto;</li>
              <li>All transaction fees (including network fees on Hedera) are your sole responsibility and are non-refundable; and</li>
              <li>The Company has no fiduciary relationship with you and owes you only the obligations expressly stated in these Terms.</li>
            </ul>
            <p className="text-foreground/80">
              You acknowledge that you are solely responsible for conducting your own due diligence and risk assessment before participating in any market. Nothing on the Site or Platform constitutes investment, trading, legal, or tax advice.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">6. Prohibited Conduct</h2>
            <p className="text-foreground/80 mb-4">You agree that you will not, in connection with the Services:</p>
            <ul className="list-disc pl-5 space-y-2 text-foreground/70">
              <li>Violate any Applicable Laws or regulations;</li>
              <li>Engage in market manipulation, wash trading, spoofing, front-running, fictitious transactions, or any form of abusive, improper, or disruptive trading activity;</li>
              <li>Use the Services for money laundering, terrorist financing, sanctions evasion, or any other illicit financial activity;</li>
              <li>Exploit bugs, vulnerabilities, or unintended behaviors in the smart contracts or the Platform;</li>
              <li>Circumvent geographic restrictions or access controls using VPNs, proxies, or similar tools;</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Services;</li>
              <li>Introduce malware, viruses, or other harmful code into the Services;</li>
              <li>Conduct denial-of-service attacks or attempt to interfere with the proper operation of the Services;</li>
              <li>Scrape, harvest, or extract data from the Services without our prior written consent;</li>
              <li>Create or participate in markets relating to illegal activities, personal violence, terrorism, exploitation of minors, or other prohibited subjects as determined by the Company; or</li>
              <li>Provide false, misleading, or deceptive information when using the Services.</li>
            </ul>
            <p className="text-foreground/80 mt-4">
              Violations of this section may result in immediate suspension or permanent termination of your access to the Services, exclusion from reward or incentive programs, and referral to law enforcement authorities where appropriate. You hereby acknowledge that tax consequences may arise from your use of the Services, and you are solely responsible for compliance with applicable tax laws.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">7. Intellectual Property</h2>
            <p className="text-foreground/80 mb-4">
              The Company or its licensors own all right, title, and interest in and to the Services — including the Site, Platform, content, software, design, and trademarks — unless otherwise indicated. Subject to these Terms, the Company grants you a limited, personal, non-exclusive, non-transferable, revocable license to access and use the Services for their intended purposes only.
            </p>
            <p className="text-foreground/80 mb-4">
              By submitting content or feedback through the Services, you grant the Company a royalty-free, sublicensable, transferable, perpetual, irrevocable, worldwide license to use, copy, modify, display, perform, and distribute such content for any business purpose, including promotion of the Services. You represent that you have the rights to grant this license and that your content does not infringe any third-party rights.
            </p>
            <p className="text-foreground/80">
              Third-party services integrated into the Platform may be subject to separate license terms. You agree to comply with all applicable third-party terms.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">8. Third-Party Services</h2>
            <p className="text-foreground/80">
              The Services may contain links to or integrations with third-party websites, applications, or services (&quot;Third-Party Services&quot;) that are not controlled by the Company. The Company has no responsibility for the content, privacy practices, availability, or accuracy of any Third-Party Service. Your use of any Third-Party Service is at your own risk and subject to the terms of that third party. Links or integrations do not imply endorsement or affiliation.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">9. Indemnification</h2>
            <p className="text-foreground/80">
              You agree to defend, indemnify, and hold harmless the Company and its affiliates, officers, directors, employees, and licensors from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in connection with: (i) your access to or use of the Services; (ii) your breach of these Terms or violation of any Applicable Law; (iii) any dispute between you and any third party; (iv) your alleged infringement of any third-party intellectual property or other rights; or (v) content or feedback you submit. We reserve the right to assume exclusive control of any defense of a matter subject to indemnification by you, and you agree to cooperate fully.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">10. Disclaimers and Limitation of Liability</h2>
            <p className="text-foreground/80 mb-4 font-medium">
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, OR QUIET ENJOYMENT.
            </p>
            <p className="text-foreground/80 mb-4 font-medium">
              THE COMPANY MAKES NO WARRANTY THAT: (I) THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE; (II) ANY RESULTS OR INFORMATION OBTAINED THROUGH THE SERVICES WILL BE ACCURATE OR RELIABLE; OR (III) ANY DEFECTS WILL BE CORRECTED.
            </p>
            <p className="text-foreground/80 mb-4 font-medium">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL THE COMPANY OR ANY OF ITS AFFILIATES, SERVICE PROVIDERS, EMPLOYEES, OFFICERS, DIRECTORS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES — INCLUDING LOST PROFITS, LOSS OF DATA, OR LOSS OF CRYPTOASSETS — EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-foreground/80 font-medium">
              THE COMPANY&apos;S AGGREGATE LIABILITY TO YOU FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICES SHALL NOT EXCEED ONE HUNDRED U.S. DOLLARS ($100). SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS OF LIABILITY; IN SUCH CASES, OUR LIABILITY SHALL BE LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">11. Governing Law and Dispute Resolution</h2>

            <h3 className="font-semibold mb-2 text-foreground">Governing Law</h3>
            <p className="text-foreground/80 mb-4">
              These Terms are governed by applicable law without regard to conflict of law principles. Except as required to be resolved by arbitration, any dispute that is not subject to arbitration shall be resolved in a venue of our choosing, and you consent to such jurisdiction.
            </p>

            <h3 className="font-semibold mb-2 text-foreground">Informal Resolution</h3>
            <p className="text-foreground/80 mb-4">
              Before initiating any formal proceeding, you agree to provide us written notice of the dispute with a description of the claim and your desired resolution (&quot;Initial Notice&quot;). We will respond within 20 days, and the parties will attempt to resolve the matter in good faith within 45 days of the Initial Notice.
            </p>

            <h3 className="font-semibold mb-2 text-foreground">Binding Arbitration</h3>
            <p className="text-foreground/80 mb-4">
              If informal resolution fails, all disputes, claims, or controversies arising out of or relating to these Terms, the Services, or your use thereof shall be resolved by binding individual arbitration. The arbitrator will have exclusive authority to resolve all issues relating to the interpretation, applicability, enforceability, and scope of these Terms and of the arbitration agreement itself.
            </p>

            <h3 className="font-semibold mb-2 text-foreground">Class Action Waiver</h3>
            <p className="text-foreground/80 font-medium">
              YOU AND THE COMPANY EACH WAIVE THE RIGHT TO A JURY TRIAL AND TO PARTICIPATE AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS ACTION, CLASS ARBITRATION, CONSOLIDATED PROCEEDING, OR REPRESENTATIVE ACTION. ALL ARBITRATIONS WILL BE CONDUCTED ON AN INDIVIDUAL BASIS ONLY.
            </p>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">12. General Provisions</h2>
            <ul className="list-disc pl-5 space-y-3 text-foreground/70">
              <li><strong className="text-foreground/90">Entire Agreement:</strong> These Terms, together with our Privacy Policy and other incorporated policies, constitute the entire agreement between you and us regarding the Services and supersede all prior agreements or understandings.</li>
              <li><strong className="text-foreground/90">Assignment:</strong> You may not assign or transfer any of your rights or obligations under these Terms without our prior written consent. We may freely assign these Terms without restriction.</li>
              <li><strong className="text-foreground/90">Waiver:</strong> Our failure to enforce any provision of these Terms does not constitute a waiver of our right to enforce it later. All waivers must be in writing to be effective.</li>
              <li><strong className="text-foreground/90">Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, that provision will be limited to the minimum extent necessary, and the remaining provisions will remain in full force and effect.</li>
              <li><strong className="text-foreground/90">No Relationship:</strong> Nothing in these Terms creates any agency, partnership, joint venture, or employment relationship between you and us.</li>
              <li><strong className="text-foreground/90">Survival:</strong> Sections 5, 7, 9, 10, 11, and 12 survive any termination or expiration of these Terms.</li>
              <li><strong className="text-foreground/90">Taxes:</strong> You are solely responsible for determining and complying with any tax obligations arising from your use of the Services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 pb-2 border-b border-border">13. Contact Us</h2>
            <p className="text-foreground/80">
              For questions, complaints, or claims regarding these Terms or the Services, please contact us at:
            </p>
            <div className="mt-4 p-4 border border-border rounded text-foreground/70">
              <p className="font-medium text-foreground mb-1">Predifi Labs</p>
              <p>Email: <a href="mailto:legal@predifi.com" className="text-foreground underline hover:text-amber-400 transition-colors">legal@predifi.com</a></p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-border mt-16 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground uppercase tracking-[0.12em]">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/tos" className="text-foreground">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/50 uppercase tracking-[0.08em]">© 2026 Predifi Labs. All rights reserved.</p>
      </footer>
    </div>
  );
}
