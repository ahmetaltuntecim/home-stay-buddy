import { Star, Heart } from "lucide-react";
import stayMountain from "@/assets/stay-mountain.jpg";
import stayBeach from "@/assets/stay-beach.jpg";
import stayVilla from "@/assets/stay-villa.jpg";
import stayTreehouse from "@/assets/stay-treehouse.jpg";

const stays = [
  {
    id: 1,
    title: "Mountain Sunrise Cabin",
    location: "Aspen, Colorado",
    price: 185,
    rating: 4.9,
    reviews: 127,
    image: stayMountain,
    tag: "Superhost",
  },
  {
    id: 2,
    title: "Beachfront Bungalow",
    location: "Tulum, Mexico",
    price: 220,
    rating: 4.8,
    reviews: 94,
    image: stayBeach,
    tag: "Popular",
  },
  {
    id: 3,
    title: "Tuscan Stone Villa",
    location: "Chianti, Italy",
    price: 310,
    rating: 5.0,
    reviews: 63,
    image: stayVilla,
    tag: "Luxe",
  },
  {
    id: 4,
    title: "Enchanted Treehouse",
    location: "Blue Ridge, Georgia",
    price: 145,
    rating: 4.9,
    reviews: 208,
    image: stayTreehouse,
    tag: "Guest Favorite",
  },
];

const FeaturedStays = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="font-body text-accent font-semibold tracking-wide uppercase text-sm mb-3">
            Handpicked for you
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Featured Home Stays
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stays.map((stay) => (
            <article
              key={stay.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow duration-300 cursor-pointer"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={stay.image}
                  alt={stay.title}
                  loading="lazy"
                  width={640}
                  height={512}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                  <Heart className="w-4 h-4 text-foreground" />
                </button>
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-body font-semibold text-foreground">
                  {stay.tag}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display text-lg font-semibold text-foreground truncate">
                    {stay.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-body text-sm font-medium text-foreground">{stay.rating}</span>
                  </div>
                </div>
                <p className="font-body text-sm text-muted-foreground mb-3">{stay.location}</p>
                <p className="font-body text-foreground">
                  <span className="font-semibold">${stay.price}</span>
                  <span className="text-muted-foreground text-sm"> / night</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedStays;
