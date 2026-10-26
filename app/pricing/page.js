import Link from "next/link";
import PricingBackdrop from "../components/PricingBackdrop";

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
      {
        label: "Classes in 12+ Indian languages",
        demo: "See how one lesson is adapted across Indian languages with English-mixed notes.",
      },
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
      {
        label: "Timestamp Q&A jumps to the exact explanation",
        demo: "Ask “How do APIs work?” and the lesson jumps directly to the API explanation.",
      },
      {
        label: "Instructor voice and chat answers",
        demo: "Hear the answer in your instructor’s voice while the same explanation appears in chat.",
      },
      {
        label: "Up to 100 AI/API credits every day",
        demo: "Use daily credits with supported text, voice, image and video AI models.",
      },
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
      {
        label: "2,000 AI/API credits every week",
        demo: "Build and experiment through the Beyond API with a fresh weekly credit allowance.",
      },
      {
        label: "Current and newly updated AI models",
        demo: "Includes supported ChatGPT models, Sarvam voice, Veo video and more.",
      },
    ],
  },
];

export default function Pricing() {
  return (
    <main className="pricing-page">
      <PricingBackdrop />
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
                {plan.features.map(feature => (
                  <li key={typeof feature === "string" ? feature : feature.label}>
                    {typeof feature === "string" ? feature : (
                      <span
                        className="feature-demo"
                        data-demo={feature.demo}
                        aria-label={`${feature.label}. ${feature.demo}`}
                        tabIndex="0"
                      >
                        {feature.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <Link className="plan-cta" href={`/dashboard?plan=${plan.name.toLowerCase().replaceAll(" ", "-")}`}>Choose {plan.name}</Link>
              <Link className="plan-preview" href={`/dashboard?plan=${plan.name.toLowerCase().replaceAll(" ", "-")}`}>Preview your dashboard ↗</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
