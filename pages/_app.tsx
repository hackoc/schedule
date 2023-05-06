import "../styles/globals.css";
import type { AppProps } from "next/app";
import Footer from "../components/Footer";
import Meta from "../components/Meta";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
          <Meta />
          <Component {...pageProps} />
    </>
  );
}

export default MyApp;
