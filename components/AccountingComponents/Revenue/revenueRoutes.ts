export const REVENUE_CHECKS_ROUTE = "/Dashboard/revenue-checks";
export const REVENUE_CHECK_INPUT_ROUTE = "/Dashboard/revenue-check-input";

export const revenueCheckInputRoute = (params: { id?: string; mode?: "import" } = {}) => {
  const query = new URLSearchParams();
  if (params.id) query.set("id", params.id);
  if (params.mode) query.set("mode", params.mode);
  const qs = query.toString();
  return qs ? `${REVENUE_CHECK_INPUT_ROUTE}?${qs}` : REVENUE_CHECK_INPUT_ROUTE;
};
