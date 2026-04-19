export function PageBackground({ src }: { src: string }) {
  return (
    <div
      aria-hidden
      className="page-bg"
      style={{ backgroundImage: `url(${src})` }}
    />
  );
}
