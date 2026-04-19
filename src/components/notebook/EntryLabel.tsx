type Props = { number: string; title: string };

export function EntryLabel({ number, title }: Props) {
  return (
    <div className="entry-label">
      <span className="num">{number}</span>
      {" \u00a0·\u00a0 "}
      {title}
    </div>
  );
}

export function EntryHeading({ children }: { children: React.ReactNode }) {
  return <h2>{children}</h2>;
}
