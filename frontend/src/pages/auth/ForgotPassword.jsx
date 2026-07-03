import PublicLayout from "../../components/PublicLayout";
import { ActionButton, Panel, buttonIcons } from "../../components/dashboard/ui";

export default function ForgotPassword() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-[520px]">
        <Panel title="Forgot Password">
          <form className="grid gap-4">
            <input className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="Email address" />
            <ActionButton icon={buttonIcons.send}>Send Reset Link</ActionButton>
          </form>
        </Panel>
      </div>
    </PublicLayout>
  );
}
