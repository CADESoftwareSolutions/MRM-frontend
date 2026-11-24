export type CsvDelimiter = "," | ";" | "\t";

const DELIMITERS: CsvDelimiter[] = [",", ";", "\t"];
const DELIMITER_SAMPLE_LINES = 10;

/** Case, spacing and punctuation don't matter; "#" reads as "number" ("Owner #" = "Owner Number"). */
export const normalizeHeader = (header: string): string =>
  header.toLowerCase().replace(/#/g, "number").replace(/[^a-z0-9]/g, "");

/** Picks the delimiter that splits the first several non-blank lines the same way most often, so a
 * title row above the header, or commas used as decimals in a ";" file, don't decide it. */
export const detectDelimiter = (text: string): CsvDelimiter => {
  const lines = text
    .slice(0, 20000)
    .replace(/"[^"]*"/g, "")
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim())
    .slice(0, DELIMITER_SAMPLE_LINES);

  let best: CsvDelimiter = ",";
  let bestScore = 0;
  let bestCount = 0;
  for (const delimiter of DELIMITERS) {
    const counts = lines.map((line) => line.split(delimiter).length - 1).filter((n) => n > 0);
    if (!counts.length) continue;
    const tally = new Map<number, number>();
    for (const n of counts) tally.set(n, (tally.get(n) ?? 0) + 1);
    let modeCount = 0;
    let modeLines = 0;
    tally.forEach((lineCount, n) => {
      if (lineCount > modeLines || (lineCount === modeLines && n > modeCount)) {
        modeLines = lineCount;
        modeCount = n;
      }
    });
    if (modeLines > bestScore || (modeLines === bestScore && modeCount > bestCount)) {
      best = delimiter;
      bestScore = modeLines;
      bestCount = modeCount;
    }
  }
  return best;
};

/** RFC 4180 CSV: quoted fields, "" escapes, delimiters and line breaks inside quotes, CRLF / LF /
 * CR line ends and a leading BOM. Excel's semicolon or tab exports are detected from the first
 * several lines. */
export const parseCsvWithDelimiter = (input: string): { rows: string[][]; delimiter: CsvDelimiter } => {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let quoted = false;

  const endField = () => {
    row.push(quoted ? field : field.trim());
    field = "";
    quoted = false;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch !== '"') field += ch;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = false;
    } else if (ch === '"' && !quoted && field.trim() === "") {
      inQuotes = true;
      quoted = true;
      field = "";
    } else if (ch === delimiter) {
      endField();
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else if (!quoted) {
      field += ch;
    }
  }
  if (field || quoted || row.length) endRow();
  return { rows, delimiter };
};

export const parseCsv = (input: string): string[][] => parseCsvWithDelimiter(input).rows;

const csvCell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export const toCsv = (rows: string[][]): string => rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

/** Why this file can't be read as a CSV, or null when it looks like one. */
export const fileProblem = (file: File): string | null => {
  const name = file.name.toLowerCase();
  if (/\.(xlsx|xlsm|xls|xlsb|ods)$/.test(name)) {
    return `${file.name} is an Excel workbook. Open it in Excel, choose File › Save As › CSV, and upload the .csv file.`;
  }
  if (!name.endsWith(".csv") && !name.endsWith(".txt") && file.type !== "text/csv") {
    return `${file.name} isn't a CSV file. Save it as .csv and upload that.`;
  }
  return null;
};

/** Reads a file as text. UTF-16 (Excel's "Unicode Text") is recognised by its byte order mark; a
 * file that isn't valid UTF-8 is read as Windows-1252, which is what Excel's plain "CSV (Comma
 * delimited)" saves, instead of showing replacement characters. */
export const readCsvText = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(buffer);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(buffer);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
};
