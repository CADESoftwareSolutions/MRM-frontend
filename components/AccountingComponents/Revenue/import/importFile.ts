import { buildSampleCheckDetailCsv } from "@/lib/checkDetailCsv";

export const downloadSampleCheckDetail = () => {
  const url = URL.createObjectURL(new Blob([buildSampleCheckDetailCsv()], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "check-detail-sample.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
