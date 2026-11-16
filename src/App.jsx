import { MotionConfig } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollProgress from './components/layout/ScrollProgress';
import Hero from './sections/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import Services from './sections/Services';
import Projects from './sections/Projects';
import Experience from './sections/Experience';
import Process from './sections/Process';
import WhyMe from './sections/WhyMe';
import Contact from './sections/Contact';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useScrollAnimations } from './hooks/useScrollAnimations';

export default function App() {
  const reducedMotion = useReducedMotion();
  useScrollAnimations(reducedMotion);

  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <Navbar />
      <main id="main">
        <Hero />
        <About />
        <Skills />
        <Services />
        <Projects />
        <Experience />
        <Process />
        <WhyMe />
        <Contact />
      </main>
      <Footer />
    </MotionConfig>
  );
}
