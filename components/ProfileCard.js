// components/ProfileCard.js
import { UserCircle2 } from "lucide-react";

export default function ProfileCard({ profile, planInfo }) {
  const displayName = profile.billing_name || profile.name || "—";
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-purple-200 bg-white">
 
      {/* Header */}
      <div
        className="
          flex items-center gap-3
          px-6 py-4
          bg-gradient-to-r
          from-purple-900
          via-purple-800
          to-purple-700
        "
      >    
        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
          <UserCircle2 className="w-6 h-6 text-white" />
        </div>
         <div>
          <p className="text-xs uppercase tracking-widest text-purple-200">
            Teacher Account
          </p>

          <h2 className="text-lg font-bold text-white">
            Profile
          </h2>
        </div>
      </div>

    <div className="p-8">
          <p className="text-xs uppercase text-base-content/50">
            Name
          </p>

          <p className="font-semibold">
            {displayName}
          </p>

        <div>
          <p className="text-xs uppercase text-base-content/50">
            Plan
          </p>

          <p className="font-semibold">
            {planInfo}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase text-base-content/50">
            Email
          </p>

          <p className="font-semibold"> 
            {profile.email}
          </p>
        </div>
    
    


         <p className="text-xs uppercase text-base-content/50">
            Joined
          </p>
          <p className="font-semibold"> 
        {new Date(profile.created_at).toLocaleDateString()}
      </p>

    </div>
      {profile.cancel_at_period_end && profile.current_period_end && (
        <p className="text-yellow-600 text-sm mt-2">
          ⚠️ Your subscription will end on{" "}
          {new Date(profile.current_period_end).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          .
        </p>
      )}
      {profile.payment_failed && (
        <p className="text-yellow-600 text-sm mt-2">
          ⚠️ Payment failed. Please update your card in your billing portal.
        </p>
      )}
    </div>
  );
}
