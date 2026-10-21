import Link from "next/link";

export const metadata = {
  title: "Pricing — Flowcus",
};

const plans = [
  {
    name: "Starter",
    price: "0",
    description: "For trying the workspace and shipping your first ideas.",
    features: ["3 documents each month", "PDF and DOCX exports", "Standard processing"],
  },
  {
    name: "Pro",
    price: "29",
    description: "For creators building polished work every week.",
    features: ["100 documents each month", "All reference formats", "Priority processing"],
    featured: true,
  },
  {
    name: "Studio",
    price: "99",
    description: "For teams producing at scale with shared standards.",
    features: ["Unlimited documents", "Shared team workspace", "Priority support"],
  },
];

export default function Pricing() {
  return (
    <main className="pricing-page">
      <div className="pricing-scenery" aria-hidden="true" />
      <div className="pricing-ornaments" aria-hidden="true">
        <span className="ornament-top-left" />
        <span className="ornament-top-right" />
        <span className="ornament-bottom-left" />
        <span className="ornament-bottom-right" />
      </div>
      <header className="pricing-heading">
        <p>Flowcus pricing</p>
        <h1>Choose your flow.</h1>
      </header>
      <section className="pricing-grid" aria-label="Pricing plans">
        {plans.map(plan => (
          <article className="plan-card" key={plan.name}>
            <div className="plan-card-content">
              <div className="plan-name">
                <h2>{plan.name}</h2>
                {plan.featured && <span>Most popular</span>}
              </div>
              <p className="plan-price"><sup>$</sup>{plan.price}<small>/ month</small></p>
              <p className="plan-description">{plan.description}</p>
              <ul>
                {plan.features.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
              <Link className="plan-cta" href="/">Choose {plan.name}</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
