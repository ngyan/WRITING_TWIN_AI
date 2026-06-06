import { InstallButton } from "@/components/InstallButton";

export function FinalCTA() {
  return (
    <section className="bg-primary-500 py-20">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Send your next message in your own voice.
        </h2>
        <p className="text-primary-100 mb-8 text-base leading-relaxed">
          Free to start. No credit card. Works in Gmail, Outlook, LinkedIn, and Slack.
        </p>
        <InstallButton location="final_cta" size="lg" variant="inverse" />
      </div>
    </section>
  );
}
