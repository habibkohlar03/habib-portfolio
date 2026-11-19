import {
  Building2,
  Globe,
  Layers,
  LifeBuoy,
  RefreshCw,
  Rocket,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
} from 'lucide-react';
import Section from '../components/ui/Section';
import { services } from '../data/services';

const ICONS = {
  globe: Globe,
  layers: Layers,
  cart: ShoppingCart,
  building: Building2,
  store: Store,
  rocket: Rocket,
  refresh: RefreshCw,
  sliders: SlidersHorizontal,
  lifebuoy: LifeBuoy,
  sparkles: Sparkles,
};

export default function Services() {
  return (
    <Section
      id="services"
      index={4}
      label="Services"
      title="What I can build for you."
      intro="From a first business website to a full WooCommerce store, plus the maintenance that keeps it running."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => {
          const Icon = ICONS[service.icon] ?? Globe;
          return (
            <li key={service.id} data-reveal data-reveal-delay={(i % 3) * 0.07}>
              <article className="hud-card group h-full p-6">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-signal transition-colors group-hover:bg-brand group-hover:text-[#14161b]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold leading-snug text-white">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{service.description}</p>
              </article>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
