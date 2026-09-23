import { forwardRef } from "react";
import { navigate } from "../router";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Stand-in for next/link: same props, in-memory navigation. */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, onClick, ...rest }, ref) {
  return (
    <a
      ref={ref}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    />
  );
});

export default Link;
