
const fs = require("fs");
let code = fs.readFileSync("apps/storefront/app/account/page.tsx", "utf8");

code = code.replace(/<Sparkle className="w-3\.5 h-3\.5" weight="fill" \/>/g, `<IconIA className="w-3.5 h-3.5" />`);
code = code.replace(/<Sparkle weight="fill" className="(.*?)" \/>/g, `<IconIA className="$1" />`);

fs.writeFileSync("apps/storefront/app/account/page.tsx", code);
console.log("Replaced Sparkle in page.tsx");

