import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  { name: "Alex Rodriguez", role: "Member since 2023", text: "IronForge completely transformed my fitness journey. The trainers are incredible and the community keeps me motivated every single day.", rating: 5 },
  { name: "Sarah Chen", role: "Pro Member", text: "Best gym I've ever been to. The equipment is top-notch, the atmosphere is electric, and the results speak for themselves.", rating: 5 },
  { name: "Marcus Johnson", role: "Elite Member", text: "The personal training sessions are worth every penny. I've achieved goals I never thought possible in just 6 months.", rating: 5 },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            WHAT OUR <span className="text-gradient">MEMBERS SAY</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card border border-border rounded-xl p-6 relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground mb-6 text-sm leading-relaxed">"{t.text}"</p>
              <div>
                <p className="font-display font-bold">{t.name}</p>
                <p className="text-muted-foreground text-sm">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
