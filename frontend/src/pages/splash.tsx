import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Splash() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-white">
      <div className="max-w-md w-full px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-24 h-24 bg-primary text-white rounded-2xl flex items-center justify-center text-4xl font-bold shadow-lg mb-8"
        >
          DS
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4"
        >
          DS Engineosys
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="text-lg text-muted-foreground mb-12"
        >
          The precise command center for business intelligence. Monitor employee efficiency and product market performance with data-driven clarity.
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
          className="w-full"
        >
          <Link href="/terms">
            <Button size="lg" className="w-full text-lg h-14" data-testid="button-get-started">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
