export default function AuthLayout({ children }) {
  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      {children}
    </main>
  );
}
