
const fs = require("fs");
let code = fs.readFileSync("apps/storefront/app/account/page.tsx", "utf8");

// Try to replace block 1
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-6">\s*\{scans\.slice\(0, 2\)\.map\(\(scan: any\) => \([\s\S]*?<\/div>\s*\)\)\}\s*<\/div>\s*\) : \(\s*<div className="relative overflow-hidden rounded-\[2rem\]/, 
`<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {scans.slice(0, 2).map((scan: any) => (
                            <SkinCoachScanCard key={scan.id} scan={scan} onClick={() => handleViewScan(scan)} />
                          ))}
                        </div>
                      ) : (
                        <div className="relative overflow-hidden rounded-[2rem]`);

// Try to replace block 2
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-6">\s*\{scans\.map\(\(scan: any\) => \([\s\S]*?<\/div>\s*\)\)\}\s*<\/div>\s*\)\}\s*<\/motion\.div>\s*\)\}/,
`<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {scans.map((scan: any) => (
                        <SkinCoachScanCard key={scan.id} scan={scan} onClick={() => handleViewScan(scan)} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}`);

fs.writeFileSync("apps/storefront/app/account/page.tsx", code);
console.log("Regex replacement successful.");

