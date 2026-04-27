import { PageHero } from "@/components/sections/PageHero";
import { images } from "@/data/site";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSiteContent, resolveImage } from "@/hooks/useSiteContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

type Item = { src: string; cat: string; alt: string };
type MediaAsset = { id: string; public_url: string; kind: "image" | "video"; filename: string; alt_text: string | null; gallery_category: string | null };
const allDefaults: Item[] = [
  { src: images.bedroom, cat: "Bedrooms", alt: "Master bedroom" },
  { src: images.bedroom2, cat: "Bedrooms", alt: "Second bedroom" },
  { src: images.bedroom2Alt1, cat: "Bedrooms", alt: "Second bedroom — wide view" },
  { src: images.bedroom2Alt2, cat: "Bedrooms", alt: "Second bedroom — headboard detail" },
  { src: images.living, cat: "Living Room", alt: "Sitting lounge" },
  { src: images.living2, cat: "Living Room", alt: "Lounge — wide view" },
  { src: images.dining, cat: "Dining Area", alt: "Dining" },
  { src: images.dining2, cat: "Dining Area", alt: "Dining — chandelier view" },
  { src: images.dining3, cat: "Dining Area", alt: "Dining — side view" },
  { src: images.kitchen, cat: "Kitchen", alt: "Kitchen" },
  { src: images.kitchen2, cat: "Kitchen", alt: "Kitchen — counter view" },
  { src: images.kitchen3, cat: "Kitchen", alt: "Kitchen — wide view" },
  { src: images.bathroom, cat: "Bathrooms", alt: "Master bathroom" },
  { src: images.bathroomAlt1, cat: "Bathrooms", alt: "Second bathroom" },
  { src: images.bathroomAlt2, cat: "Bathrooms", alt: "Bathroom — vanity detail" },
  { src: images.view, cat: "Views", alt: "City view" },
  { src: images.hero, cat: "Exterior", alt: "Balcony" },
  { src: images.bedroomAlt1, cat: "Bedrooms", alt: "Bedroom — wider view" },
  { src: images.bedroomAlt2, cat: "Bedrooms", alt: "Bedroom — detail" },
];
const baseCats = ["All", ...Array.from(new Set(allDefaults.map((i) => i.cat)))];

const Gallery = () => {
  const { get } = useSiteContent();
  const h = (k: string, fb: string) => get("gallery", "hero", k, fb);
  const all: Item[] = allDefaults.map((d, i) => ({
    ...d,
    src: resolveImage(get("gallery", "grid", `image${i + 1}`, ""), d.src),
  }));
  const [active, setActive] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const [publishedMedia, setPublishedMedia] = useState<MediaAsset[]>([]);
  const publishedPhotos = publishedMedia.filter((item) => item.kind === "image");
  const publishedVideos = publishedMedia.filter((item) => item.kind === "video");
  const cats = ["All", ...Array.from(new Set([...baseCats.slice(1), ...publishedPhotos.map((item) => item.gallery_category).filter(Boolean) as string[]]))];
  const photoItems = [
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
                {filtered.map((img, i) => (
                  <button
                    key={`${img.src}-${i}`}
                    onClick={() => setOpen(img.src)}
                    className="block w-full overflow-hidden rounded-2xl group break-inside-avoid"
                  >
                    <img src={img.src} alt={img.alt} loading="lazy" className="w-full transition-elegant group-hover:scale-105" />
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos">
              {publishedVideos.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">No published videos yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {publishedVideos.map((video) => (
                    <video key={video.id} src={video.public_url} controls preload="metadata" className="aspect-video w-full rounded-2xl bg-secondary object-cover" />
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