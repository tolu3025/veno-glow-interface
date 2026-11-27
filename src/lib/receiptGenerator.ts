/**
 * Generates a branded Kuka Pay receipt as a downloadable PNG image.
 */

interface ReceiptData {
  type: string;
  amount: string;
  status: string;
  date: string;
  time: string;
  reference?: string;
  transactionId?: string;
  rows: { label: string; value: string }[];
  /** Optional bank logo URL (e.g. for withdrawal receipts). */
  bankLogoUrl?: string;
  /** Optional bank display name shown next to the logo. */
  bankName?: string;
}

function loadImageSafe(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const PURPLE = "#6B21A8";
const PURPLE_LIGHT = "#9333EA";
const ACCENT = "#84CC16";
const BG = "#0F0A1A";
const CARD_BG = "#1A1425";
const BORDER = "#2D2240";
const TEXT_MUTED = "#9CA3AF";
const TEXT_WHITE = "#F9FAFB";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateReceiptImage(data: ReceiptData): Promise<Blob> {
  const bankLogo = data.bankLogoUrl ? await loadImageSafe(data.bankLogoUrl) : null;
  const showBankBlock = !!(bankLogo || data.bankName);
  const bankBlockHeight = showBankBlock ? 96 : 0;

  return new Promise((resolve) => {
    const W = 750;
    const PADDING = 50;
    const CONTENT_W = W - PADDING * 2;

    // Pre-calculate height
    const rowHeight = 48;
    const headerHeight = 220 + bankBlockHeight;
    const amountHeight = 120;
    const dividerGap = 40;
    const rowsHeight = data.rows.length * rowHeight;
    const footerHeight = 120;
    const H = headerHeight + amountHeight + dividerGap + rowsHeight + dividerGap + footerHeight + 40;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Card background
    roundRect(ctx, 24, 24, W - 48, H - 48, 24);
    ctx.fillStyle = CARD_BG;
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Decorative gradient circle top-right
    const gradient = ctx.createRadialGradient(W - 80, 80, 10, W - 80, 80, 200);
    gradient.addColorStop(0, "rgba(147, 51, 234, 0.15)");
    gradient.addColorStop(1, "rgba(147, 51, 234, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    let y = 60;

    // Logo / Brand
    ctx.fillStyle = PURPLE_LIGHT;
    ctx.font = "bold 28px 'Syne', 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KUKA PAY", W / 2, y + 30);

    y += 50;
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = "14px 'Syne', 'Inter', sans-serif";
    ctx.fillText("Transaction Receipt", W / 2, y + 20);

    y += 40;

    // Bank logo block (e.g. withdrawal receipts)
    if (showBankBlock) {
      const logoSize = 64;
      const cx = W / 2;
      const ly = y;
      roundRect(ctx, cx - logoSize / 2 - 6, ly - 6, logoSize + 12, logoSize + 12, 16);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      if (bankLogo) {
        ctx.drawImage(bankLogo, cx - logoSize / 2, ly, logoSize, logoSize);
      } else if (data.bankName) {
        // Initials fallback: up to 2 letters from the bank name
        const initials = data.bankName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join("");
        ctx.fillStyle = PURPLE;
        ctx.font = "bold 26px 'Syne', 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initials || "?", cx, ly + logoSize / 2 + 2);
        ctx.textBaseline = "alphabetic";
      }
      if (data.bankName) {
        ctx.fillStyle = TEXT_WHITE;
        ctx.font = "bold 14px 'Syne', 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(data.bankName, cx, ly + logoSize + 24);
      }
      y += bankBlockHeight;
    }

    // Divider line
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(W - PADDING, y);
    ctx.stroke();

    y += 30;

    // Status badge
    const statusColor = data.status.toLowerCase() === "completed" ? ACCENT :
                         data.status.toLowerCase() === "pending" ? "#EAB308" : "#EF4444";
    const badgeText = data.status.toUpperCase();
    ctx.font = "bold 12px 'Syne', 'Inter', sans-serif";
    const badgeW = ctx.measureText(badgeText).width + 24;
    roundRect(ctx, W / 2 - badgeW / 2, y - 4, badgeW, 24, 12);
    ctx.fillStyle = statusColor + "20";
    ctx.fill();
    ctx.fillStyle = statusColor;
    ctx.textAlign = "center";
    ctx.fillText(badgeText, W / 2, y + 12);

    y += 40;

    // Amount
    ctx.fillStyle = TEXT_WHITE;
    ctx.font = "bold 44px 'Space Mono', 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(data.amount, W / 2, y + 40);

    y += 60;

    // Type label
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = "14px 'Syne', 'Inter', sans-serif";
    ctx.fillText(data.type, W / 2, y + 14);

    y += 40;

    // Divider - dashed
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = BORDER;
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(W - PADDING, y);
    ctx.stroke();
    ctx.setLineDash([]);

    y += 20;

    // Detail rows
    ctx.textAlign = "left";
    for (const row of data.rows) {
      ctx.fillStyle = TEXT_MUTED;
      ctx.font = "13px 'Syne', 'Inter', sans-serif";
      ctx.fillText(row.label, PADDING + 16, y + 30);

      ctx.fillStyle = TEXT_WHITE;
      ctx.font = "14px 'Space Mono', 'Courier New', monospace";
      ctx.textAlign = "right";
      // Truncate long values
      let val = row.value;
      while (ctx.measureText(val).width > CONTENT_W - 150 && val.length > 10) {
        val = val.slice(0, -4) + "…";
      }
      ctx.fillText(val, W - PADDING - 16, y + 30);
      ctx.textAlign = "left";

      y += rowHeight;
    }

    y += 10;

    // Divider
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = BORDER;
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(W - PADDING, y);
    ctx.stroke();
    ctx.setLineDash([]);

    y += 30;

    // Footer
    ctx.fillStyle = TEXT_MUTED;
    ctx.font = "11px 'Syne', 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("This is an electronic receipt generated by Kuka Pay", W / 2, y + 14);
    ctx.fillText(`${data.date} · ${data.time}`, W / 2, y + 34);

    // Accent bar at bottom
    roundRect(ctx, W / 2 - 40, H - 36, 80, 4, 2);
    ctx.fillStyle = PURPLE;
    ctx.fill();

    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/png");
  });
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Blob> {
  // Render the receipt as a PNG image first (handles all characters correctly)
  const imgBlob = await generateReceiptImage(data);
  const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());

  // Build a minimal PDF that embeds the PNG image
  const imgW = 750;
  // Estimate image height from data (same calc as generateReceiptImage)
  const rowHeight = 48;
  const headerHeight = 220;
  const amountHeight = 120;
  const dividerGap = 40;
  const rowsHeight = data.rows.length * rowHeight;
  const footerHeight = 120;
  const imgH = headerHeight + amountHeight + dividerGap + rowsHeight + dividerGap + footerHeight + 40;

  // Scale to fit a nice page size (points)
  const pageW = 450;
  const pageH = Math.round((imgH / imgW) * pageW);

  // PDF objects
  const objects: string[] = [];
  const binaryObjects: { index: number; data: Uint8Array }[] = [];

  const addObj = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  // 1: Catalog
  addObj("<< /Type /Catalog /Pages 2 0 R >>");
  // 2: Pages
  addObj(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  // 3: Page
  addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>`);

  // 4: Content stream - draw image full page
  const drawCmd = `q ${pageW} 0 0 ${pageH} 0 0 cm /Img Do Q\n`;
  addObj(`<< /Length ${drawCmd.length} >>\nstream\n${drawCmd}endstream`);

  // 5: Image XObject (PNG) - will be binary
  // We store a placeholder and handle binary separately
  const imgObjHeader = `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length `;

  // Convert PNG to raw RGB pixels and deflate them
  const bitmap = await createImageBitmap(imgBlob);
  const canvas = document.createElement("canvas");
  canvas.width = imgW;
  canvas.height = imgH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, imgW, imgH);

  // Extract RGB (skip alpha)
  const rgbData = new Uint8Array(imgW * imgH * 3);
  for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
    rgbData[j] = imageData.data[i];
    rgbData[j + 1] = imageData.data[i + 1];
    rgbData[j + 2] = imageData.data[i + 2];
  }

  // Compress with DeflateRaw (pako-free, using CompressionStream API)
  const compressed = await compressData(rgbData);

  // Build binary image object
  const imgObjStr = `${imgObjHeader}${compressed.length} >>`;
  // We'll manually assemble this object with binary stream

  // Now build the full PDF as binary
  const encoder = new TextEncoder();
  const header = encoder.encode("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  const parts: (Uint8Array | string)[] = [];
  const offsets: number[] = [];
  let pos = header.length;

  parts.push(header as any);

  // Write text objects 1-4
  for (let i = 0; i < objects.length; i++) {
    const objStr = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    const bytes = encoder.encode(objStr);
    offsets.push(pos);
    pos += bytes.length;
    parts.push(bytes as any);
  }

  // Write binary image object (5)
  const imgObjStart = encoder.encode(`5 0 obj\n${imgObjStr}\nstream\n`);
  const imgObjEnd = encoder.encode(`\nendstream\nendobj\n`);
  offsets.push(pos);
  pos += imgObjStart.length + compressed.length + imgObjEnd.length;
  parts.push(imgObjStart as any);
  parts.push(compressed as any);
  parts.push(imgObjEnd as any);

  // xref
  const totalObjs = 6; // 0 + 5 objects
  let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`;
  parts.push(encoder.encode(xref) as any);

  // Combine all parts
  const totalLen = parts.reduce((sum, p) => sum + (p instanceof Uint8Array ? p.length : new TextEncoder().encode(p as string).length), 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    const bytes = p instanceof Uint8Array ? p : encoder.encode(p as string);
    result.set(bytes, offset);
    offset += bytes.length;
  }

  return new Blob([result], { type: "application/pdf" });
}

async function compressData(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  writer.write(data.buffer as ArrayBuffer);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalLen);
  let off = 0;
  for (const c of chunks) {
    result.set(c, off);
    off += c.length;
  }
  return result;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function escapePdf(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export async function downloadReceiptImage(data: ReceiptData, filename: string) {
  const blob = await generateReceiptImage(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadReceiptPdf(data: ReceiptData, filename: string) {
  const blob = await generateReceiptPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareReceiptImage(data: ReceiptData, filename: string) {
  const blob = await generateReceiptImage(data);
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: "Kuka Pay Receipt", files: [file] });
  } else {
    await downloadReceiptImage(data, filename);
  }
}
