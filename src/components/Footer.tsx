import { Home } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5" />
              <span className="font-display text-lg font-bold">HomeStay</span>
            </div>
            <p className="font-body text-sm text-primary-foreground/70 leading-relaxed">
              Curating extraordinary home stays for travelers who seek authentic, local experiences.
            </p>
          </div>
          {[
            { title: "Explore", links: ["All Stays", "Experiences", "Destinations", "Last Minute"] },
            { title: "Company", links: ["About Us", "Careers", "Press", "Blog"] },
            { title: "Support", links: ["Help Center", "Safety", "Cancellation", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2 font-body text-sm text-primary-foreground/70">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-primary-foreground transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center font-body text-sm text-primary-foreground/50">
          © 2026 HomeStay. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
