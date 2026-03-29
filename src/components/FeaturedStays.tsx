import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import stayMountain from "@/assets/stay-mountain.jpg";
import stayBeach from "@/assets/stay-beach.jpg";
import stayVilla from "@/assets/stay-villa.jpg";
import stayTreehouse from "@/assets/stay-treehouse.jpg";

const fallbackStays = [
  { id: "f1", title: "Dağ Evi", location: "Bolu, Türkiye", price: 1850, rating: 4.9, reviews_count: 127, image_url: stayMountain, tag: "Süper Ev Sahibi" },
  { id: "f2", title: "Sahil Bungalovu", location: "Antalya, Türkiye", price: 2200, rating: 4.8, reviews_count: 94, image_url: stayBeach, tag: "Popüler" },
  { id: "f3", title: "Taş Villa", location: "Kapadokya, Türkiye", price: 3100, rating: 5.0, reviews_count: 63, image_url: stayVilla, tag: "Lüks" },
  { id: "f4", title: "Ağaç Ev", location: "Sapanca, Türkiye", price: 1450, rating: 4.9, reviews_count: 208, image_url: stayTreehouse, tag: "Misafir Favorisi" },
];

const placeholderImages = [stayMountain, stayBeach, stayVilla, stayTreehouse];

const FeaturedStays = () => {
  const [stays, setStays] = useState(fallbackStays);
  const [fromDb, setFromDb] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from as any)("houses_public").select("*").order("created_at", { ascending: false }).limit(8);
      if (data && data.length > 0) {
        setStays(data.map((h: any, i: number) => ({
          id: h.id,
          title: h.title,
          location: h.location || "",
          price: Number(h.price),
          rating: Number(h.rating) || 0,
          reviews_count: h.reviews_count || 0,
          image_url: h.image_url || placeholderImages[i % placeholderImages.length],
          tag: h.tag || "",
        })));
        setFromDb(true);
      }
    };
    load();
  }, []);

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="font-body text-accent font-semibold tracking-wide uppercase text-sm mb-3">Sizin için seçtiklerimiz</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Öne Çıkan Evler</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stays.map((stay) => {
            const Wrapper = fromDb ? Link : "div" as any;
            const wrapperProps = fromDb ? { to: `/house/${stay.id}` } : {};
            return (
              <Wrapper key={stay.id} {...wrapperProps} className="block">
                <article className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow duration-300 cursor-pointer h-full">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={stay.image_url} alt={stay.title} loading="lazy" width={640} height={512} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors" onClick={(e) => e.preventDefault()}>
                      <Heart className="w-4 h-4 text-foreground" />
                    </button>
                    {stay.tag && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-body font-semibold text-foreground">{stay.tag}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display text-lg font-semibold text-foreground truncate">{stay.title}</h3>
                      {stay.rating > 0 && (
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span className="font-body text-sm font-medium text-foreground">{stay.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="font-body text-sm text-muted-foreground mb-3">{stay.location}</p>
                    <p className="font-body text-foreground">
                      <span className="font-semibold">₺{stay.price.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm"> / gece</span>
                    </p>
                  </div>
                </article>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedStays;
