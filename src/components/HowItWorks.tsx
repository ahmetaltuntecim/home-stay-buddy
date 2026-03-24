import { Search, CalendarCheck, Home } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Browse our curated collection of unique homes across the globe.",
  },
  {
    icon: CalendarCheck,
    title: "Book",
    description: "Reserve your stay with instant confirmation and flexible cancellation.",
  },
  {
    icon: Home,
    title: "Enjoy",
    description: "Arrive, settle in, and experience living like a local.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="font-body text-accent font-semibold tracking-wide uppercase text-sm mb-3">
            Simple & seamless
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
                <step.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="font-body text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
