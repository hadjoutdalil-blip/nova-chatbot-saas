const fs = require("fs");
const b = fs.readFileSync("E:/nova-chatbot-saas/scripts/data/cetim-metrologie.csv");
const lines = b.toString("utf8").split(/\r?\n/);
const line1 = lines[1];
const idx = line1.indexOf("m\u00e9trologie");
console.log("Line1 snippet:", line1.substring(idx-2, idx+12));
console.log("Bytes at +2,+3 (should be é):", b.slice(idx+1, idx+3).toString("hex"));
console.log("If 0xC3 0xA9 => UTF-8 é, if 0xE9 => Latin1 é");
