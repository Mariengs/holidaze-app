import Header from "./components/Header";
import Footer from "./components/Footer";
import { Outlet } from "react-router";
import "./styles/layout.module.css";

export default function RootLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
