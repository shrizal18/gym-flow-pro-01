import { motion } from "framer-motion";
import { Target, Users, Zap, Shield } from "lucide-react";

const features = [
  { icon: Target, title: "Expert Coaching", desc: "Certified trainers to guide your journey" },
  { icon: Zap, title: "Modern Equipment", desc: "State-of-the-art machines & free weights" },
  { icon: Users, title: "Community", desc: "Supportive fitness community & group classes" },
  { icon: Shield, title: "24/7 Access", desc: "Train on your schedule, any time of day" },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            WHY CHOOSE <span className="text-gradient">IRONFORGE</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            More than a gym — a complete fitness ecosystem designed for results.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
