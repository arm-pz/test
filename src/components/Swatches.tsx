import {motion} from 'framer-motion';
import {cloths, type ClothId} from '../content';

type Props = {value: ClothId; onChange: (id: ClothId) => void};

/** The one thing to do with your hands: re-cut the jacket in another cloth. */
export function Swatches({value, onChange}: Props) {
  const current = cloths.find((c) => c.id === value)!;
  return (
    <div className="mt-8">
      <div role="radiogroup" aria-label="Cloth" className="flex flex-wrap gap-3">
        {cloths.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === value}
            aria-label={c.name}
            onClick={() => onChange(c.id)}
            className="relative size-11 cursor-pointer rounded-full border-0 p-0"
            style={{background: 'transparent'}}
          >
            {c.id === value && (
              <motion.span layoutId="swatch-ring" className="absolute -inset-1 rounded-full border-2 border-bone" transition={{type: 'spring', stiffness: 420, damping: 32}} />
            )}
            <span className="absolute inset-0.5 overflow-hidden rounded-full" style={{background: c.swatch, boxShadow: 'inset 0 0 0 1px rgb(236 230 218 / 0.28)'}}>
              {c.id === 'chalk' && <span className="absolute inset-0" style={{background: 'repeating-linear-gradient(90deg, transparent 0 7px, rgba(236,230,218,0.55) 7px 8px)'}} />}
            </span>
          </button>
        ))}
      </div>
      <motion.p key={current.id} initial={{opacity: 0, y: 6}} animate={{opacity: 1, y: 0}} className="mt-3 text-small text-mute">
        {current.name}
      </motion.p>
    </div>
  );
}
