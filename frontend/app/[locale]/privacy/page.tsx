export default function PrivacyPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-headline text-3xl font-extrabold text-surface-900">Privacy Policy</h1>
      <div className="space-y-3 text-[14px] text-surface-600">
        <p>We collect only the data necessary to provide account, project, payment, and moderation features.</p>
        <p>Authentication and session handling use secure, HttpOnly cookie-based tokens.</p>
        <p>Your data is processed for service operation, security, and regulatory compliance requirements.</p>
      </div>
    </section>
  );
}
