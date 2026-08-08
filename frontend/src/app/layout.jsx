import "../styles.css";

export const metadata = {
  title: "Samruddhi organic products ",
  description: "Natural pantry essentials and traditional kitchenware.",
  icons: {
    icon: "/favicon.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
