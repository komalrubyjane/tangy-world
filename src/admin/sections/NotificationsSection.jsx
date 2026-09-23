// No `notifications` table exists yet — real-time admin notifications are
// tracked as a dedicated later phase (notifications + audit log). This is an
// honest placeholder, not a stub with fabricated rows.
export const NotificationsSection = () => (
  <div className="bg-[#191410] border-2 border-dashed border-[#C99A2E]/40 p-10 rounded-sm text-center">
    <h3 className="text-lg font-bold text-[#C99A2E] mb-2">NOTIFICATIONS — COMING SOON</h3>
    <p className="text-xs text-[#E7D5A4]/60 max-w-md mx-auto leading-relaxed">
      Real-time notifications (new bookings, applications, messages) need a dedicated <code className="text-[#E7D5A4]/80">notifications</code> table
      and delivery pipeline, which is scoped as its own phase. Nothing here is fabricated in the meantime.
    </p>
  </div>
);
