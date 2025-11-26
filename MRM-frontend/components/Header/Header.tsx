import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import ServicesDropDown from "./ServicesDropDown/ServicesDropDown";

const Header = () => {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
      }}
    >
      <nav className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="cursor-pointer text-xl font-bold text-white no-underline hover:text-white"
        >
          CADE Solutions
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="/"
            className={`text-base font-medium transition-colors no-underline
            ${
              pathname === "/"
                ? "text-[#e91e63]"
                : "text-white hover:text-[#e91e63]"
            }
              `}
          >
            Home
          </Link>
          <ServicesDropDown />
          <Link
            href="/Pricing"
            className={`text-base font-medium transition-colors no-underline
            ${
              pathname === "/Pricing"
                ? "text-[#e91e63]"
                : "text-white hover:text-[#e91e63]"
            }
              `}
          >
            Pricing
          </Link>
          <Link
            href="/ContactUs"
            className={`text-base font-medium transition-colors no-underline
            ${
              pathname === "/ContactUs"
                ? "text-[#e91e63]"
                : "text-white hover:text-[#e91e63]"
            }
              `}
          >
            Contact Us
          </Link>
        </div>
        <Link href="/Login/Login">
          <Button
            variant="outline"
            className="border-white bg-transparent text-white hover:border-[#e91e63] hover:bg-transparent hover:text-[#e91e63] cursor-pointer"
          >
            Login
          </Button>
        </Link>
      </nav>
    </header>
  );
};

export default Header;
