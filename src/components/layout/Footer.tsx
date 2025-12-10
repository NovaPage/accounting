export function Footer() {
  return (
    <footer className="w-full border-t mt-10">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} Orbit Accounting. Todos los derechos reservados.
      </div>
    </footer>
  );
}
