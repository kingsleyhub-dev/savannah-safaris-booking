import { useState } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { images } from "@/data/site";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plane, Car, MapPin, UserCheck, ArrowRight, Users, Snowflake, Music2, ShieldCheck, Wifi } from "lucide-react";
import { toast } from "sonner";
import { CTA } from "@/components/sections/CTA";
import { useSiteContent, resolveImage } from "@/hooks/useSiteContent";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { shared, type Asset } from "@/assets/registry";
import { cn } from "@/lib/utils";

const services = [
  { icon: Plane, title: "Airport Transfer", desc: "Reliable JKIA pickup & drop-off in a clean, comfortable vehicle.", price: "from $35" },
  { icon: Car, title: "Car Rental", desc: "Self-drive options curated for the city or upcountry adventures.", price: "from $50/day" },
  { icon: MapPin, title: "City Recommendations", desc: "Concierge tips for dining, safari and attractions.", price: "Complimentary" },
  { icon: UserCheck, title: "Driver-on-Demand", desc: "Need a chauffeur for the day? We've got you.", price: "from $80/day" },
];

// Editorial gallery for the featured chauffeur service. The first item is
// the hero shot; the rest power the thumbnail rail and click-to-swap.
const nissanGallery: { asset: Asset; label: string }[] = [
  { asset: shared.nissan2, label: "City profile" },
  { asset: shared.nissan, label: "Ready to roll" },
  { asset: shared.nissan3, label: "Front view" },
  { asset: shared.nissanInterior, label: "VIP interior" },
];

const nissanSpecs = [
  { icon: Users, label: "Up to 13 seats" },
  { icon: Snowflake, label: "Climate control" },
  { icon: Music2, label: "Premium audio" },
  { icon: Wifi, label: "Wi-Fi on request" },
  { icon: ShieldCheck, label: "Insured & licensed" },
];

const Services = () => {
  const { get } = useSiteContent();
  const h = (k: string, fb: string) => get("services", "hero", k, fb);
  const f = (k: string, fb: string) => get("services", "featured", k, fb);
  const [activeShot, setActiveShot] = useState(0);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Request received — Joel will be in touch within the hour.");
    (e.target as HTMLFormElement).reset();
  };

  // Admin can override the main featured image via the CMS; if so we render
  // it as a plain <img> (no AVIF/srcset since we don't know what was uploaded).
  const featuredOverride = resolveImage(f("image", ""), "");
  const activeAsset = nissanGallery[activeShot].asset;

  return (
    <>
      <PageHero
        eyebrow={h("eyebrow", "Add-on services")}
        title={h("title", "Premium convenience, on request")}
        subtitle={h("subtitle", "From airport pickups to chauffeured city tours — we make travel effortless.")}
        image={resolveImage(h("image", ""), images.nissan)}
      />

      <section className="section-padding">
        <div className="container-luxe grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {services.map((s) => (
            <Card key={s.title} className="p-6 hover:shadow-elegant transition-smooth group">
              <div className="size-12 rounded-xl gradient-forest text-primary-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <s.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
              <p className="text-primary font-medium text-sm">{s.price}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ───────── Featured: Joel's Nissan ───────── */}
      <section className="section-padding bg-gradient-to-b from-secondary/40 via-secondary/20 to-background">
        <div className="container-luxe">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-14">
            {/* Gallery column — main image + thumbnail rail */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl shadow-elegant aspect-[4/3] bg-muted">
                {featuredOverride ? (
                  <img
                    src={featuredOverride}
                    alt="Joel's Nissan with driver"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <ResponsiveImage
                    key={activeAsset.base}
                    asset={activeAsset}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    loading="eager"
                    fetchPriority="high"
                    className="absolute inset-0 h-full w-full object-cover animate-fade-in"
                  />
                )}
                {/* Subtle gradient + caption pill */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                  {nissanGallery[activeShot].label}
                </div>
              </div>

              {/* Thumbnail rail */}
              {!featuredOverride && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {nissanGallery.map((shot, idx) => (
                    <button
                      key={shot.asset.base}
                      type="button"
                      onClick={() => setActiveShot(idx)}
                      aria-label={`Show ${shot.label}`}
                      aria-pressed={activeShot === idx}
                      className={cn(
                        "relative aspect-[4/3] overflow-hidden rounded-xl ring-2 ring-transparent transition-all",
                        "hover:ring-accent/60 focus-visible:ring-accent focus-visible:outline-none",
                        activeShot === idx && "ring-accent shadow-elegant",
                      )}
                    >
                      <ResponsiveImage
                        asset={shot.asset}
                        sizes="20vw"
                        className={cn(
                          "absolute inset-0 h-full w-full object-cover transition-transform duration-500",
                          activeShot === idx ? "scale-105" : "scale-100 opacity-85 hover:opacity-100",
                        )}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy + spec chips + booking form */}
            <div className="space-y-6">
              <span className="eyebrow">— Featured service</span>
              <h2 className="font-display fluid-h2 font-bold text-balance">
                {f("title", "Joel's Nissan with driver")}
              </h2>
              <p className="text-base whitespace-pre-line text-muted-foreground sm:text-lg">
                {f("body", "A premium chauffeured experience for guests who want to explore Nairobi or travel further afield in comfort and style. Joel is friendly, punctual, and knows the city inside out — from quick airport runs to full-day safari excursions.")}
              </p>

              {/* Spec chips with icons */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {nissanSpecs.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-full bg-card border border-border/60 px-3 py-2">
                    <Icon className="size-4 text-primary shrink-0" />
                    <span className="text-xs font-medium truncate">{label}</span>
                  </div>
                ))}
              </div>

              {/* Trip-type tag pills */}
              <div className="flex flex-wrap gap-2">
                {["City Trips", "Long Distance", "Airport Pickup", "Safari Day Trips", "Hourly Hire"].map((tag) => (
                  <span key={tag} className="px-4 py-1.5 rounded-full bg-secondary/60 text-foreground/80 text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <Card className="p-6 mt-2 shadow-elegant">
                <h3 className="font-display text-xl font-bold mb-4">Request Joel's Nissan</h3>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Name</Label><Input required placeholder="Your name" /></div>
                    <div className="space-y-2"><Label>Phone / WhatsApp</Label><Input required placeholder="+254..." /></div>
                    <div className="space-y-2"><Label>Pickup date</Label><Input required type="date" /></div>
                    <div className="space-y-2"><Label>Trip type</Label>
                      <select className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm">
                        <option>City trip</option>
                        <option>Long distance</option>
                        <option>Airport pickup</option>
                        <option>Full day hire</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Where are you headed? Any special requests?" rows={3} /></div>
                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    Request Booking <ArrowRight className="size-4" />
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
};

export default Services;
