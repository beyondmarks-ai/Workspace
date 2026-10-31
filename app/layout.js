import "./globals.css";
import WorkspaceNavigation from './components/workspace-navigation';

export const metadata = {
  title: "Beyond Marks — WorkSpace",
  description: "A space for ideas that move beyond the expected.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><WorkspaceNavigation/><div className="beyondmarks-page">{children}</div></body>
    </html>
  );
}
