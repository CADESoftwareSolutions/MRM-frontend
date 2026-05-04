/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      { source: "/login",                destination: "/Login/Login" },
      { source: "/Dashboard/directory",  destination: "/Dashboard/DashboardDirectory/Directory" },
      { source: "/Dashboard/leases",     destination: "/Dashboard/DashboardDirectory/Leases" },
      { source: "/Dashboard/checks",     destination: "/Dashboard/DashboardDirectory/Checks" },
      { source: "/Dashboard/documents",  destination: "/Dashboard/DashboardDirectory/Documents" },
      { source: "/Dashboard/wells",      destination: "/Dashboard/DashboardDirectory/Wells" },
      { source: "/Dashboard/deeds",      destination: "/Dashboard/DashboardDirectory/Deeds" },
      { source: "/Dashboard/reports",    destination: "/Dashboard/DashboardDirectory/Reports" },
      { source: "/Dashboard/settings",   destination: "/Dashboard/Settings" },
    ];
  },
};

module.exports = nextConfig;
