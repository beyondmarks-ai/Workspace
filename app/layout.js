import "./globals.css";

export const metadata = {
  title: "Beyond Marks — WorkSpace",
  description: "A space for ideas that move beyond the expected.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
