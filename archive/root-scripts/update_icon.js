const fs = require('fs');

const svgContent = fs.readFileSync('C:/Users/LENOVO/Documents/Harestech/welfare-platform/Gemini_Generated_Image_9ns9hx9ns9hx9ns9.svg', 'utf8');

// Extract the path data
const paths = [];
let match;
const regex = /<path d="([^"]+)"/g;
while ((match = regex.exec(svgContent)) !== null) {
  paths.push(match[1].replace(/\n/g, ' ')); // clean up newlines in path d attribute
}

const code = `import React from "react";

export const IconIA = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement> & { weight?: any }>(
  ({ className = "", style, weight, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        version="1.0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2048 2048"
        preserveAspectRatio="xMidYMid meet"
        className={className}
        style={style}
        {...props}
      >
        <g transform="translate(0.000000,2048.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none">
          ${paths.map(p => `<path d="${p}" />`).join('\n          ')}
        </g>
      </svg>
    );
  }
);
IconIA.displayName = "IconIA";
`;

fs.writeFileSync('C:/Users/LENOVO/Documents/Harestech/welfare-platform/apps/storefront/components/ui/icons/IconIA.tsx', code);
console.log('IconIA.tsx updated successfully with SVG paths.');
