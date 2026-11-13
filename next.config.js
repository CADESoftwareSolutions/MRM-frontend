/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      { source: "/login",                   destination: "/Login/Login" },
      { source: "/Dashboard/contacts",      destination: "/Dashboard/DashboardDirectory/Contacts" },
      { source: "/Dashboard/leases",        destination: "/Dashboard/DashboardDirectory/Leases" },
      { source: "/Dashboard/chart-of-accounts", destination: "/Dashboard/DashboardDirectory/ChartOfAccounts" },
      { source: "/Dashboard/revenue-check-input", destination: "/Dashboard/DashboardDirectory/RevenueCheckInput" },
      { source: "/Dashboard/revenue-checks",    destination: "/Dashboard/DashboardDirectory/RevenueChecks" },
      { source: "/Dashboard/ap-invoices",       destination: "/Dashboard/DashboardDirectory/APInvoices" },
      { source: "/Dashboard/pay-bills",         destination: "/Dashboard/DashboardDirectory/PayBills" },
      { source: "/Dashboard/documents",     destination: "/Dashboard/DashboardDirectory/Documents" },
      { source: "/Dashboard/wells",         destination: "/Dashboard/DashboardDirectory/Wells" },
      { source: "/Dashboard/acquisitions",  destination: "/Dashboard/DashboardDirectory/Acquisitions" },
      { source: "/Dashboard/deeds",         destination: "/Dashboard/DashboardDirectory/Deeds" },
      { source: "/Dashboard/tracts",        destination: "/Dashboard/DashboardDirectory/Tracts" },
      { source: "/Dashboard/reports",       destination: "/Dashboard/DashboardDirectory/Reports" },
      { source: "/Dashboard/settings",      destination: "/Dashboard/Settings" },
    ];
  },
};

module.exports = nextConfig;
