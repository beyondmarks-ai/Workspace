import Link from "next/link";

export const metadata = {
  title: "Pricing — Flowcus",
};

const plans = [
  {
    name: "Classes",
    price: "2,000",
    period: "1 month",
    description: "Multilingual classes and notes for one focused month.",
    features: [
      "Classes in 12+ Indian languages",
      "Multilingual notes mixed with English",
      "Full video lesson library",
      "1 month of class access",
    ],
  },
  {
    name: "Interactive",
    price: "4,500",
    period: "3 months",
    description: "Ask the lesson, hear the answer and continue learning.",
    features: [
      "Everything in Classes",
      "Timestamp Q&A jumps to the exact explanation",
      "Instructor voice and chat answers",
      "Up to 100 AI/API credits every day",
    ],
    featured: true,
  },
  {
    name: "All Access",
    price: "6,000",
    period: "6 months",
    description: "The complete learning and AI toolkit for six months.",
    features: [
      "Everything in Interactive",
      "6 months of classes and notes",
      "2,000 AI/API credits every week",
      "ChatGPT, Sarvam voice, Veo video and more",
    ],
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
              <p className="plan-price"><sup>₹</sup>{plan.price}<small>/ {plan.period}</small></p>
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
