import * as React from "react";

export const IconIA = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, style, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={className}
      style={{
        ...style,
        display: "inline-block",
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/ai_face_icon.png)",
        WebkitMaskSize: "contain",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskImage: "url(/ai_face_icon.png)",
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
      {...props}
    />
  );
});

IconIA.displayName = "IconIA";
