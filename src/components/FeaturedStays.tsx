import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FeaturedStays = () => {
  const [stays, setStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("houses_public" as any).select("*").order("created_at", { ascending: false }).limit(8);
        if (data) {
          setStays(data.map((h: any) => ({
            id: h.id,
            title: h.title,
            location: h.location || "",
            price: Number(h.price),
            rating: Number(h.rating) || 0,
            reviews_count: h.reviews_count || 0,
            image_url: h.image_url || "/placeholder.svg",
            tag: h.tag || "",
          })));
        }
      } catch (error) {
        console.error("Error loading stays:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="font-body text-accent font-semibold tracking-wide uppercase text-sm mb-3">Sizin için seçtiklerimiz</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Öne Çıkan Evler</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-muted rounded-2xl aspect-[4/3]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (stays.length === 0) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="font-body text-accent font-semibold tracking-wide uppercase text-sm mb-3">Sizin için seçtiklerimiz</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Öne Çıkan Evler</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stays.map((stay) => {
            return (
              <Link key={stay.id} to={`/house/${stay.id}`} className="block">
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
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedStays;
