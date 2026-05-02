import { PageHero } from "@/components/sections/PageHero";
import { images } from "@/data/site";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSiteContent, resolveImage } from "@/hooks/useSiteContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LazyVideo } from "@/components/media/LazyVideo";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { gallery, videos, type Asset } from "@/assets/registry";

type Item = { src: string; cat: string; alt: string; asset?: Asset };
type MediaAsset = { id: string; public_url: string; kind: "image" | "video"; filename: string; alt_text: string | null; gallery_category: string | null };

// Each tile is paired with its registry Asset so <ResponsiveImage> can serve
// AVIF/WebP + sized srcset. The legacy `src` is kept as a fallback for
// CMS-overridden tiles (admin-uploaded images that aren't in the registry).
const allDefaults: Item[] = [
  { asset: gallery.bedroom1, src: images.bedroom, cat: "Bedrooms", alt: "Master bedroom" },
  { asset: gallery.bedroom2, src: images.bedroom2, cat: "Bedrooms", alt: "Second bedroom" },
  { asset: gallery.bedroom2Alt1, src: images.bedroom2Alt1, cat: "Bedrooms", alt: "Second bedroom — wide view" },
  { asset: gallery.bedroom2Alt2, src: images.bedroom2Alt2, cat: "Bedrooms", alt: "Second bedroom — headboard detail" },
  { asset: gallery.living1, src: images.living, cat: "Living Room", alt: "Sitting lounge" },
  { asset: gallery.living2, src: images.living2, cat: "Living Room", alt: "Lounge — wide view" },
  { asset: gallery.dining1, src: images.dining, cat: "Dining Area", alt: "Dining" },
  { asset: gallery.dining2, src: images.dining2, cat: "Dining Area", alt: "Dining — chandelier view" },
  { asset: gallery.dining3, src: images.dining3, cat: "Dining Area", alt: "Dining — side view" },
  { asset: gallery.kitchen1, src: images.kitchen, cat: "Kitchen", alt: "Kitchen" },
  { asset: gallery.kitchen2, src: images.kitchen2, cat: "Kitchen", alt: "Kitchen — counter view" },
  { asset: gallery.kitchen3, src: images.kitchen3, cat: "Kitchen", alt: "Kitchen — wide view" },
  { asset: gallery.bathroom1, src: images.bathroom, cat: "Bathrooms", alt: "Master bathroom" },
  { asset: gallery.bathroom1Alt1, src: images.bathroomAlt1, cat: "Bathrooms", alt: "Second bathroom" },
  { asset: gallery.bathroom1Alt2, src: images.bathroomAlt2, cat: "Bathrooms", alt: "Bathroom — vanity detail" },
  { asset: gallery.cityView, src: images.view, cat: "Views", alt: "City view" },
  { src: images.hero, cat: "Exterior", alt: "Balcony" },
  { asset: gallery.bedroom1Alt1, src: images.bedroomAlt1, cat: "Bedrooms", alt: "Bedroom — wider view" },
  { asset: gallery.bedroom1Alt2, src: images.bedroomAlt2, cat: "Bedrooms", alt: "Bedroom — detail" },
];
const baseCats = ["All", ...Array.from(new Set(allDefaults.map((i) => i.cat)))];

// Grid renders ~3 columns on lg → roughly 33vw per tile, 50vw on tablet, 100vw on mobile
const GRID_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

const Gallery = () => {
  const { get } = useSiteContent();
  const h = (k: string, fb: string) => get("gallery", "hero", k, fb);
  // CMS overrides drop the registry asset (admin-uploaded URL wins) and we
  // render with a plain <img>. Otherwise we keep the typed asset for AVIF.
  const all: Item[] = allDefaults.map((d, i) => {
    const override = resolveImage(get("gallery", "grid", `image${i + 1}`, ""), "");
    return override ? { ...d, src: override, asset: undefined } : d;
  });
  const [active, setActive] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const [publishedMedia, setPublishedMedia] = useState<MediaAsset[]>([]);
  const publishedPhotos = publishedMedia.filter((item) => item.kind === "image");
  const publishedVideos = publishedMedia.filter((item) => item.kind === "video");
  const cats = ["All", ...Array.from(new Set([...baseCats.slice(1), ...publishedPhotos.map((item) => item.gallery_category).filter(Boolean) as string[]]))];
  const photoItems: Item[] = [
    ...all,
    ...publishedPhotos.map((item) => ({ src: item.public_url, cat: item.gallery_category ?? "Uploaded", alt: item.alt_text ?? item.filename })),
  ];
  const filtered = active === "All" ? photoItems : photoItems.filter((i) => i.cat === active);

  useEffect(() => {
    (supabase.from("media_assets") as any).select("id, public_url, kind, filename, alt_text, gallery_category").eq("show_in_gallery", true).eq("is_published", true).order("gallery_sort_order", { ascending: true }).order("created_at", { ascending: false }).then(({ data }: { data: MediaAsset[] | null }) => {
      setPublishedMedia((data as MediaAsset[]) ?? []);
    });
  }, []);

  return (
    <>
      <PageHero
        eyebrow={h("eyebrow", "Gallery")}
        title={h("title", "Inside a Nairobi sanctuary")}
        subtitle={h("subtitle", "Soft light, refined details, and city views from every angle.")}
        image={resolveImage(h("image", ""), images.hero)}
      />

      <section className="section-padding">
        <div className="container-luxe">
          <Tabs defaultValue="photos" className="space-y-10">
            <TabsList className="mx-auto flex w-fit">
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="space-y-10">
              <div className="flex flex-wrap gap-2 justify-center">
                {cats.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActive(c)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-smooth ${
                      active === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/80 hover:bg-secondary/70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {filtered.map((img, i) => {
                  // First 6 tiles are likely above the fold on desktop — eager-load
                  // them so they appear instantly. The rest stay native-lazy.
                  const isAboveFold = i < 6;
                  return (
                    <button
                      key={`${img.src}-${i}`}
                      onClick={() => setOpen(img.src)}
                      className="block w-full overflow-hidden rounded-2xl group break-inside-avoid"
                    >
                      {img.asset ? (
                        <ResponsiveImage
                          asset={img.asset}
                          alt={img.alt}
                          sizes={GRID_SIZES}
                          loading={isAboveFold ? "eager" : "lazy"}
                          fetchPriority={isAboveFold ? "high" : "auto"}
                          className="w-full transition-elegant group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={img.src}
                          alt={img.alt}
                          loading={isAboveFold ? "eager" : "lazy"}
                          decoding="async"
                          className="w-full transition-elegant group-hover:scale-105"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="videos">
              {publishedVideos.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">No published videos yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {publishedVideos.map((video) => (
                    <div key={video.id} className="aspect-video">
                      <LazyVideo
                        src={video.public_url}
                        poster={videos.galleryIntro.posterBase ? { base: videos.galleryIntro.posterBase, alt: video.alt_text ?? videos.galleryIntro.posterAlt } : "/assets/gallery/videos/intro-poster.jpg"}
                        ariaLabel={`Play ${video.filename}`}
                        className="aspect-video"
                        videoClassName="rounded-2xl"
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Dialog open={!!open} onOpenChange={() => setOpen(null)}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-0 shadow-none">
          {open && <img src={open} alt="" className="w-full rounded-2xl" />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Gallery;
