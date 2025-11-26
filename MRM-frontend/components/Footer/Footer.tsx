import React, { useEffect, useState } from "react";
import Link from "next/link";

const Footer = () => {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer
      className="flex flex-wrap items-center justify-between px-8 py-4"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
      }}
    >
      <p className="text-sm text-white">
        © {year ?? ""} Cade. All rights reserved.
      </p>

      <nav className="mt-2 flex gap-8 sm:mt-0">
        {["Home", "Services", "Pricing", "Contact Us"].map((link) => (
          <Link
            key={link}
            href={link === "Home" ? "/" : `/${link.replace(/\s+/g, "")}`}
            className="cursor-pointer font-medium text-white no-underline transition-colors hover:text-[#e91e63]"
          >
            {link}
          </Link>
        ))}
      </nav>
    </footer>
  );
};

export default Footer;
