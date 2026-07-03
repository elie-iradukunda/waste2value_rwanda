import PublicLayout from "../../components/PublicLayout";
import { Panel, ProgressBar } from "../../components/dashboard/ui";

export default function About() {
  return (
    <PublicLayout>
      <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <h1 className="text-4xl font-extrabold text-ink">Circular Economy Impact</h1>
          <p className="mt-6 max-w-3xl text-base font-medium leading-8 text-muted">
            Waste2Value Rwanda helps companies reduce disposal costs, gives SMEs access to affordable raw materials, and creates trusted digital proof for reuse activity.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {["Industrial waste exchange", "Smart matching", "Digital certificates", "Sustainability scoring"].map((item) => (
              <Panel key={item}>
                <h2 className="text-xl font-extrabold text-ink">{item}</h2>
                <p className="mt-4 text-sm font-medium leading-6 text-muted">Designed for verified companies, transport providers and environmental partners.</p>
              </Panel>
            ))}
          </div>
        </div>
        <Panel title="Impact mix">
          <div className="grid gap-5">
            <ProgressBar label="Plastic" value={82} />
            <ProgressBar label="Metal" value={66} />
            <ProgressBar label="Wood" value={48} />
            <ProgressBar label="Paper" value={34} />
          </div>
        </Panel>
      </section>
    </PublicLayout>
  );
}
