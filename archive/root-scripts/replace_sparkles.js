const fs = require('fs');
const path = require('path');

const files = [
  'apps/storefront/components/ambassadrices/landing.tsx',
  'apps/storefront/components/ui/skin-coach-flow.tsx',
  'apps/storefront/components/ambassadrices/dashboard.tsx',
  'apps/storefront/components/ui/skin-analysis-result-view.tsx',
  'apps/storefront/app/skin-coach/result/page.tsx',
  'apps/storefront/components/ui/chat-widget.tsx',
  'apps/storefront/components/ui/search-modal.tsx',
  'apps/storefront/components/ui/navbar.tsx',
  'apps/storefront/components/home/learning-center.tsx',
  'apps/storefront/app/shop/ShopClient.tsx',
  'apps/storefront/components/home/skin-coach.tsx',
  'apps/storefront/components/home/promotions-bento.tsx',
  'apps/storefront/app/shop/product/[id]/ProductDetailClient.tsx',
  'apps/storefront/components/home/hero-bento.tsx',
  'apps/storefront/app/account/login/page.tsx',
  'apps/storefront/app/account/register/page.tsx',
  'apps/storefront/app/account/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.join('C:/Users/LENOVO/Documents/Harestech/welfare-platform', relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace <Sparkle ...> with <IconIA ...>
  // Also handle <Sparkle weight="fill" ...>
  content = content.replace(/<Sparkle\b/g, '<IconIA');

  // Remove Sparkle from Phosphor imports
  content = content.replace(/,\s*Sparkle\b|\bSparkle\s*,/g, '');
  content = content.replace(/\{\s*Sparkle\s*\}/g, '{}'); // if it was the only one

  // Add import if not present and if IconIA is used
  if (content.includes('<IconIA') && !content.includes('IconIA"')) {
    const importStmt = `import { IconIA } from "@/components/ui/icons/IconIA";\n`;
    // Add it after the last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLine + 1) + importStmt + content.slice(endOfLine + 1);
    } else {
      content = importStmt + content;
    }
  }

  // Ensure no IconIA weight prop (IconIA doesn't support weight)
  content = content.replace(/(<IconIA[^>]*?)\s*weight="fill"/g, '$1');
  content = content.replace(/(<IconIA[^>]*?)\s*weight='fill'/g, '$1');

  fs.writeFileSync(fullPath, content);
}
console.log('Done replacing Sparkle with IconIA');
