import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import { ActionButton, Panel } from "../components/dashboard/ui";

export default function NotFound() {
  return (
    <PublicLayout>
      <Panel title="Page Not Found" className="mx-auto max-w-[560px]">
        <p className="mb-6 text-sm font-medium leading-6 text-muted">The requested platform page does not exist.</p>
        <Link to="/">
          <ActionButton>Go Home</ActionButton>
        </Link>
      </Panel>
    </PublicLayout>
  );
}
