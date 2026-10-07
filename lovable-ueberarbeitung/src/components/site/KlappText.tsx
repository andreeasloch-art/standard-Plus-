/** Text wie auf einer Klapptafel: wechselt der Text, klappt jedes Zeichen kurz nacheinander um. */
export function KlappText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      <span key={text} aria-hidden>
        {[...text].map((z, i) => (
          <span key={i} className="klapp" style={{ animationDelay: `${i * 22}ms` }}>
            {z === " " ? " " : z}
          </span>
        ))}
      </span>
    </span>
  );
}
