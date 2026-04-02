import { Link } from 'react-router-dom';
import { COMMUNITY_NAME } from '@/constants/app';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Ride — Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mt-1">Version 1.0 · Effective April 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">1. Who Controls Your Data</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This app is deployed and administered by your community (barangay or HOA). The community
          admin — a volunteer member of your community — controls all data within this deployment.
          The original creators and contributors of the Community Ride software have no access to
          your data, no visibility into your community's Firebase project, and no ability to retrieve,
          modify, or delete your information. All data responsibility rests entirely with your
          community admin and with you as a user.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">2. What We Collect</h2>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Your full name, mobile number, and home address (street/block only)</li>
          <li>Your email address (for login)</li>
          <li>A photo of your government ID (for community verification by your admin)</li>
          <li>Vehicle information (if you register as a driver)</li>
          <li>Trip history: routes, departure times, passengers you rode with</li>
          <li>Optional: a photo taken by a driver when you board a trip</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">3. How Your Data Is Used</h2>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>To verify your identity within the community (ID photo reviewed by admin only)</li>
          <li>To display your name on trips you post or join</li>
          <li>To generate shareable safety links for you and your travel companions</li>
          <li>To produce LTFRB-compliant passenger manifests</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">4. Data Retention — 90-Day Automatic Deletion</h2>
        <p className="text-muted-foreground text-sm">Community Ride automatically deletes data on a 90-day rolling basis:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Trip history is permanently deleted 90 days after the trip date</li>
          <li>Your account is permanently deleted if you have not logged in for 90 days (logging in resets this window — active users are never deleted)</li>
          <li>Passenger boarding photos are permanently deleted after 7 days</li>
          <li>Safety card and manifest links expire (display only) after 48 hours, and are permanently deleted from the database after 90 days</li>
        </ul>
        <p className="text-muted-foreground text-sm">This deletion is automatic and irreversible. No data is archived or backed up beyond this window.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">5. Who Can See Your Data</h2>
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
                ['Your name and trip details', 'Verified community members'],
                ['Your ID photo', 'Community admin only'],
                ['Your boarding photo (if taken)', 'The driver of that specific trip only'],
                ['Safety card link (driver name, vehicle, trip)', 'Anyone with the link — intentionally public'],
                ['Manifest link (passenger names, mobile, trip)', 'Anyone with the link — intentionally public'],
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
        <h2 className="font-semibold text-foreground">6. Shareable Links — Your Responsibility</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          When you generate a Driver Safety Card or Passenger Manifest link, the information in
          that link is intentionally accessible to anyone who receives the URL — no login required.
          This is by design, so family members can view it without an account.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You are responsible for who you share these links with. The creators of Community Ride
          accept no liability for any harm arising from the sharing or misuse of these links.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">7. No Advertising, No Data Sales</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride does not display advertisements. Your data is never sold, rented, or
          shared with any third party for commercial purposes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">8. No Liability for Data Breaches</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The creators and contributors of Community Ride accept no liability for unauthorized access
          to data stored in your community's Firebase project. Security of the Firebase project is
          the responsibility of the community admin who deployed this app. Users are encouraged to
          contact their community admin if they believe their data has been compromised.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">9. Your Rights</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You may request deletion of your account and all associated data at any time by contacting
          your community admin directly. The community admin has full access to the Firebase console
          and can delete your data manually.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">10. National Privacy Commission (NPC) Compliance</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Each community deployment is operated independently. The community admin — as the effective
          data controller — is responsible for compliance with the Philippine Data Privacy Act of 2012
          (Republic Act 10173) and NPC regulations. The software's creators make no representation
          regarding the compliance of any specific community deployment.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">11. Changes</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If this policy is updated, you will be notified in-app and asked to re-accept before
          continuing to use the app.
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
