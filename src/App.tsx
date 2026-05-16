import IntelligenceSidebar from "./components/IntelligenceSidebar";
import RouteConsole from "./components/RouteConsole";
import MobilityGraph from "./components/MobalityGraph";
import { motion } from "motion/react";

export default function App() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen w-full overflow-hidden"
    >
      <IntelligenceSidebar />
      <RouteConsole />
      <MobilityGraph />
    </motion.main>
  );
}
