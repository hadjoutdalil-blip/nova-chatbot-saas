const fs = require("fs");
const b = fs.readFileSync("E:/nova-chatbot-saas/scripts/data/cetim-metrologie.csv");
const lines = b.toString("utf8").split(/\r?\n/);
// Find a line with étalonnage
for (let i = 1; i < lines.length; i++) {
  if (lines[i].includes("\u00e9talonnage")) {
    console.log("Found étalonnage on line", i);
    const line = lines[i];
    const start = line.indexOf("\u00e9talonnage");
    console.log("Context:", line.substring(Math.max(0,start-5), start+15));
    console.log("Bytes at position:", b.slice(start, start+12).toString("hex"));
    for (let j = start; j < start + 12 && j < b.length; j++) {
      console.log("  byte offset", j, "= 0x" + b[j].toString(16).toUpperCase(), String.fromCharCode(b[j]));
    }
    break;
  }
}
