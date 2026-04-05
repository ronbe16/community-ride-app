import { Link } from 'react-router-dom';
import { COMMUNITY_NAME } from '@/constants/app';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Ride — Terms of Use</h1>
        <p className="text-muted-foreground text-sm mt-1">Version 1.1 · Effective April 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">1. What Community Ride Is</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride is a free, open-source carpooling coordination tool for barangay and village
          communities in the Philippines. It is a software tool only — not a transportation service,
          transport network, ride-hailing platform, or transport network vehicle service (TNVS).
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          There is no administrator, moderator, or central authority overseeing this platform.
          Community Ride operates without any approval, verification, or vetting process. All
          trust and safety decisions are made entirely between the members themselves.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">2. No Transport Service</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride does not provide transportation. It does not employ drivers, own or operate
          vehicles, dispatch rides, set fares, collect payments, or guarantee the availability or
          safety of any ride or driver. All carpooling arrangements are made directly and voluntarily
          between community members.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">3. Complete Disclaimer of Liability</h2>
        <p className="text-muted-foreground text-sm leading-relaxed font-medium uppercase text-xs">
          THE CREATORS, CONTRIBUTORS, AND PUBLISHERS OF COMMUNITY RIDE — INCLUDING THE ORIGINAL
          AUTHOR AND ANY PERSON OR ORGANIZATION WHO HAS DEPLOYED OR MODIFIED THIS SOFTWARE —
          ACCEPT NO LEGAL LIABILITY OF ANY KIND ARISING FROM THE USE OF THIS APPLICATION.
        </p>
        <p className="text-muted-foreground text-sm">This includes but is not limited to:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Accidents, injuries, or deaths occurring during any carpooling arrangement</li>
          <li>Loss, theft, or damage to property during a trip</li>
          <li>Disputes between members over fares, conduct, or agreements</li>
          <li>Failure of a driver to hold a valid license or comply with LTFRB requirements</li>
          <li>Any criminal act committed by any user of the platform</li>
          <li>Inaccuracy of information submitted by users (names, vehicle details, photos)</li>
          <li>Unauthorized access to shared safety links or manifests</li>
          <li>Data loss resulting from platform downtime or Firebase/Cloudinary service interruption</li>
          <li>Any harm arising from reliance on ratings, trip counts, or other trust signals</li>
        </ul>
        <p className="text-muted-foreground text-sm leading-relaxed">
          By using Community Ride, you acknowledge that all risk associated with carpooling
          arrangements — including personal safety — is assumed entirely by you.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">4. No Identity Verification</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride does not verify the identity of any user. Registration requires only a
          name and mobile number. There is no ID check, background check, or approval process.
          Members are responsible for conducting their own due diligence before agreeing to share
          a vehicle with another person.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">5. Member Responsibility — When Driving</h2>
        <p className="text-muted-foreground text-sm">Members who post and lead trips are solely and entirely responsible for:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Holding a valid, current driver's license</li>
          <li>Maintaining an LTO-registered, roadworthy vehicle</li>
          <li>Obtaining and complying with any required LTFRB carpooling special permit</li>
          <li>The safety, conduct, and wellbeing of all passengers in their vehicle</li>
          <li>Any accident, injury, or loss occurring during the trip</li>
          <li>Compliance with all applicable Philippine laws and regulations</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">6. Member Responsibility — When Riding</h2>
        <p className="text-muted-foreground text-sm">Members who join trips are solely and entirely responsible for:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Their own decision to board any vehicle</li>
          <li>Verifying the driver and vehicle to their own satisfaction before boarding</li>
          <li>Sharing their trip details with a trusted contact before departure</li>
          <li>Their personal safety before, during, and after a trip</li>
          <li>Any financial arrangement made with the driver</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">7. Optional Safety Photo Exchange</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride allows members to optionally photograph each other's face, ID, or vehicle
          plate number during a trip for safety purposes. By using this feature:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>You consent to being photographed by the other party</li>
          <li>You accept that these photos may be shared via a safety link to the other party's
            designated contacts</li>
          <li>You understand these photos are automatically deleted 24 hours after the trip</li>
          <li>You take sole responsibility for any photos you capture and share</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">8. Cost Sharing</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Any gas contribution, fuel cost sharing, or financial arrangement is made privately and
          directly between members. Community Ride does not process, broker, facilitate, record,
          or guarantee any payment. Community Ride is not a party to any financial arrangement.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">9. No Warranty</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride is provided "AS IS" and "AS AVAILABLE" without warranty of any kind,
          express or implied. The creators make no warranty that the software will be error-free,
          uninterrupted, secure, or free of harmful components.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">10. Data and Privacy</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your data is governed by our{' '}
          <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          Trip history is automatically deleted after 90 days. Safety exchange photos are deleted
          after 24 hours.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">11. Governing Law</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This software is published as open-source under the MIT License. These terms are governed
          by the laws of the Republic of the Philippines.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">12. Changes</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          These terms may be updated. You will be notified in-app and asked to re-accept if the
          terms change.
        </p>
      </section>

      <p className="text-muted-foreground/60 text-xs text-center pt-4 border-t border-border">
        Community Ride · {COMMUNITY_NAME}
      </p>
    </div>
  );
}
