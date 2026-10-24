import {useEffect} from 'react';
import {Header} from './components/Header';
import {Hero} from './components/Hero';
import {Visit} from './components/Visit';
import {useReducedMotion} from './hooks/useReducedMotion';
import {startSmoothScroll} from './lib/scroll';

export default function App() {
  const reduced = useReducedMotion();
  useEffect(() => (reduced ? undefined : startSmoothScroll()), [reduced]);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Visit />
      </main>
    </>
  );
}
