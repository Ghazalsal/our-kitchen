import { readFileSync, writeFileSync } from "node:fs";

const path = "/home/ubuntu/our-kitchen/client/src/pages/Admin.tsx";
let source = readFileSync(path, "utf8");

const replacements = [
  ['<td className="p-4 font-bold">${product.price}</td>', '<td className="p-4 font-bold">{formatILS(product.price)}</td>'],
  ['<td className="p-4">${item.total.toFixed(2)}</td>', '<td className="p-4">{formatILS(item.total)}</td>'],
  ['<b>${(line.price * line.quantity).toFixed(2)}</b>', '<b>{formatILS(line.price * line.quantity)}</b>'],
  ['coupon.type === "fixed" ? `$${coupon.value} off` : "Free delivery"', 'coupon.type === "fixed" ? `${formatILS(coupon.value)} off` : "Free delivery"'],
  ['<td className="p-4 text-xs text-[#73675E]">${coupon.minSpend} min · ends {coupon.expiresAt}</td>', '<td className="p-4 text-xs text-[#73675E]">{formatILS(coupon.minSpend)} min · ends {coupon.expiresAt}</td>'],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`Expected admin currency source fragment was not found: ${from}`);
  source = source.replace(from, to);
}

writeFileSync(path, source);
