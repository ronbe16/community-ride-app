import { Link } from 'react-router-dom';
import { COMMUNITY_NAME } from '@/constants/app';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Ride — Terms of Use</h1>
        <p className="text-muted-foreground text-sm mt-1">Version 1.0 · Effective April 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">1. What Community Ride Is</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride is a free, open-source carpooling coordination tool for barangay and village
          communities in the Philippines. It is a software tool only — not a transportation service,
          transport network, ride-hailing platform, or transport network vehicle service (TNVS).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">2. No Transport Service</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride does not provide transportation. It does not employ drivers, own or operate
          vehicles, dispatch rides, set fares, collect payments, or guarantee the availability or safety
          of any ride or driver. All carpooling arrangements are made directly and voluntarily between
          community members.
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
          <li>Disputes between drivers and passengers over fares, conduct, or agreements</li>
          <li>Failure of a driver to hold a valid license or comply with LTFRB requirements</li>
          <li>Any criminal act committed by any user of the platform</li>
          <li>Inaccuracy of information submitted by users (names, IDs, vehicle details)</li>
          <li>Unauthorized access to shared safety links or manifests</li>
          <li>Data loss resulting from platform downtime or Firebase service interruption</li>
        </ul>
        <p className="text-muted-foreground text-sm leading-relaxed">
          By using Community Ride, you acknowledge that all risk associated with carpooling
          arrangements — including personal safety — is assumed entirely by you.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">4. Driver Responsibility</h2>
        <p className="text-muted-foreground text-sm">Drivers who post trips are solely and entirely responsible for:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Holding a valid, current driver's license</li>
          <li>Maintaining an LTO-registered, roadworthy vehicle</li>
          <li>Obtaining and complying with any required LTFRB carpooling special permit</li>
          <li>The safety, conduct, and wellbeing of passengers in their vehicle</li>
          <li>Any accident, injury, or loss occurring during the trip</li>
          <li>Compliance with all applicable Philippine laws and regulations</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">5. Passenger Responsibility</h2>
        <p className="text-muted-foreground text-sm">Passengers are solely and entirely responsible for:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Their own decision to board any vehicle</li>
          <li>Verifying driver and vehicle information to their own satisfaction before boarding</li>
          <li>Sharing their trip details with a trusted contact</li>
          <li>Their personal safety before, during, and after a trip</li>
          <li>Any agreement made with a driver regarding cost sharing</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">6. Cost Sharing</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Any gas contribution, fuel cost sharing, or financial arrangement is made privately and
          directly between the driver and passengers. Community Ride does not process, broker,
          facilitate, record, or guarantee any payment. Community Ride is not a party to any
          financial arrangement between users.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">7. Community Admin Responsibility</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The community administrator (the person who deployed this app for the community) is a
          volunteer community member — not an employee, agent, or representative of the software's
          creators. The community admin is not responsible for the conduct of verified users, and
          Community Ride's creators bear no liability for any action taken or not taken by the
          community admin.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">8. No Warranty</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Community Ride is provided "AS IS" and "AS AVAILABLE" without warranty of any kind,
          express or implied. The creators make no warranty that the software will be error-free,
          uninterrupted, secure, or free of harmful components.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">9. Data and Privacy</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your data is governed by our{' '}
          <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          Trip history is automatically deleted after 90 days.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">10. Governing Law</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This software is published as open-source under the MIT License. These terms are governed
          by the laws of the Republic of the Philippines.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-foreground">11. Changes</h2>
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
