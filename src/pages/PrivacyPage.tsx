import { Link } from 'react-router-dom';
import { COMMUNITY_NAME } from '@/constants/app';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Ride — Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mt-1">Version 1.1 · Effective April 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">1. Who Controls Your Data</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride has no central administrator. Each deployment runs on its own Firebase
          project controlled entirely by the person who set it up (typically a tech-savvy community
          volunteer). The original creators and contributors of the Community Ride open-source
          software have absolutely no access to your data, no visibility into any community's
          Firebase project, and no ability to retrieve, modify, or delete your information.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You and the person who deployed this app for your community are the only parties with
          any access to your data. If you have concerns about your data, contact whoever set up
          this app in your community.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">2. What We Collect</h2>
        <p className="text-muted-foreground text-sm font-medium">At registration:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Your full name</li>
          <li>Your mobile number (display only — not verified via OTP)</li>
          <li>Your email address (used for login)</li>
        </ul>
        <p className="text-muted-foreground text-sm font-medium mt-3">When you use the app:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Trip history: routes, departure times, members you traveled with</li>
          <li>Your trip count and average star rating</li>
          <li>Optional vehicle information (make, model, year, plate number, color) if you post trips</li>
          <li>Optional LTFRB permit number and photo if you choose to add it</li>
        </ul>
        <p className="text-muted-foreground text-sm font-medium mt-3">During a trip (optional, your choice):</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Photos you take of the other party's face, ID card, or vehicle plate
            (these are temporary — deleted 24 hours after trip departure)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">3. What We Do NOT Collect</h2>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Government ID photos at registration (removed as of v1.1)</li>
          <li>Home address</li>
          <li>OTP or phone verification records</li>
          <li>Payment information of any kind</li>
          <li>Location data or GPS tracking</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">4. How Your Data Is Used</h2>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>To display your name and trip history on the app</li>
          <li>To calculate and show your rating and trip count to other members</li>
          <li>To generate shareable safety links containing your trip and vehicle details</li>
          <li>To produce LTFRB-compliant passenger manifests</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">5. Data Retention — Automatic Deletion</h2>
        <div className="overflow-x-auto">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Data</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Deleted after</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['Safety exchange photos (face, ID, plate)', '24 hours after trip departure'],
                ['Trip history', '90 days after trip date'],
                ['Safety card and manifest links', '90 days after trip date'],
                ['Your account', '90 days after your last login (active users never deleted)'],
              ].map(([data, retention]) => (
                <tr key={data} className="border-b border-border">
                  <td className="py-2 pr-4 align-top">{data}</td>
                  <td className="py-2 align-top">{retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This deletion is automatic and irreversible. No data is archived or backed up
          beyond these windows.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">6. Who Can See Your Data</h2>
        <div className="overflow-x-auto">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Data</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Who can see it</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['Your name, rating, trip count', 'All signed-in community members'],
                ['Your vehicle details', 'All signed-in community members (on trip cards)'],
                ['Your mobile number', 'Included in manifest links — visible to anyone with the link'],
                ['Safety exchange photos', 'Only the member who received them + anyone they share the link with'],
                ['Safety card link contents', 'Anyone with the link — intentionally public for family sharing'],
                ['Manifest link contents', 'Anyone with the link — intentionally public for LTFRB compliance'],
              ].map(([data, who]) => (
                <tr key={data} className="border-b border-border">
                  <td className="py-2 pr-4 align-top">{data}</td>
                  <td className="py-2 align-top">{who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">7. Shareable Links — Your Responsibility</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Safety card and manifest links are intentionally public — no login is required to view
          them. This is by design so family members can check on you without needing an account.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You are responsible for who you share these links with. Once shared, the link is
          accessible to anyone who receives it. The creators of Community Ride accept no liability
          for any harm arising from the sharing or misuse of these links.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">8. Optional Safety Photo Exchange — Special Notice</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          When you use the in-trip photo exchange feature:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Photos are stored temporarily in Cloudinary (a third-party image hosting service)</li>
          <li>They are accessible via the safety link URL to anyone you share it with</li>
          <li>They are permanently deleted from Cloudinary 24 hours after the trip departure time</li>
          <li>You consent to being photographed when you agree to participate in this exchange</li>
          <li>Participation is entirely optional and must be agreed to by both parties</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">9. No Advertising, No Data Sales</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride does not display advertisements. Your data is never sold, rented, or
          shared with any third party for commercial purposes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">10. No Liability for Data Breaches</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The creators and contributors of Community Ride accept no liability for unauthorized
          access to data stored in your community's Firebase project or Cloudinary account.
          Security of these services is the responsibility of whoever deployed this app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">11. Third-Party Services</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride uses the following third-party services to function:
        </p>
        <div className="overflow-x-auto">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Service</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Purpose</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Their Privacy Policy</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="py-2 pr-4 align-top">Firebase (Google)</td>
                <td className="py-2 pr-4 align-top">Authentication, database, push notifications</td>
                <td className="py-2 align-top">
                  <a href="https://firebase.google.com/support/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                    firebase.google.com/support/privacy
                  </a>
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 align-top">Cloudinary</td>
                <td className="py-2 pr-4 align-top">Temporary storage of safety exchange photos</td>
                <td className="py-2 align-top">
                  <a href="https://cloudinary.com/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                    cloudinary.com/privacy
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your use of Community Ride is also subject to these services' terms and privacy policies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">12. Your Rights (Data Privacy Act of 2012 — RA 10173)</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Under Philippine law, you have the right to:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Access your personal data held in the app</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Withdraw consent at any time by deleting your account</li>
        </ul>
        <p className="text-muted-foreground text-sm leading-relaxed">
          To exercise these rights, delete your account from the Profile page, or contact
          whoever deployed this app in your community.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">13. Changes</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If this policy is updated, you will be notified in-app and asked to re-accept before
          continuing to use the app. The version and effective date at the top of this page
          will be updated accordingly.
        </p>
      </section>

      <div className="text-sm text-muted-foreground pt-2">
        Also see our{' '}
        <Link to="/terms" className="text-primary underline">Terms of Use</Link>.
      </div>

      <p className="text-muted-foreground/60 text-xs text-center pt-4 border-t border-border">
        Community Ride · {COMMUNITY_NAME}
      </p>
    </div>
  );
}
