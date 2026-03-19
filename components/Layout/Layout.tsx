import React, { PropsWithChildren } from "react";
import Head from "next/head";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

const Layout: React.FC<PropsWithChildren> = ({ children }) => (
  <div>
    <Head>
      <title>CADE</title>
      <link rel="icon" href="/images/homePage/logo.png" />
    </Head>
    <Header />
    <div>{children}</div>
    <Footer />
  </div>
);

export default Layout;
