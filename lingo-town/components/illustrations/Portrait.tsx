import { useId } from "react";
import type { PortraitStyle } from "@/data/types";

type Props = {
  style: PortraitStyle;
  size?: number;
  className?: string;
  /** Background disc colour; defaults to the soft teal token. */
  bg?: string;
  title?: string;
  /** Draw without the background disc (for placing inside scenes). */
  bare?: boolean;
};

/** Parametric, grown-up character portrait in the town palette. */
export function Portrait({ style, size = 56, className, bg = "var(--lt-teal-soft)", title, bare }: Props) {
  const id = useId();
  const clip = `pc-${id}`;
  const { skin, hair, hairStyle, outfit, accent = "var(--lt-terra)", glasses, beard } = style;
  const ink = "#1F2A2E";

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="48" cy="48" r="48" />
        </clipPath>
      </defs>
      <g clipPath={bare ? undefined : `url(#${clip})`}>
        {!bare && (
          <>
            <rect width="96" height="96" fill={bg} />
            {/* soft light behind the head */}
            <circle cx="48" cy="40" r="30" fill="#FFFDF8" opacity="0.35" />
          </>
        )}

        {/* hair that sits behind the head */}
        {hairStyle === "long" && (
          <path d="M28 46C26 26 38 19 48 19C60 19 70 27 68 46L71 74C62 78 34 78 25 74Z" fill={hair} />
        )}
        {hairStyle === "hijab" && (
          <path
            d="M25 52C23 29 35 17 48 17C61 17 73 29 71 52C71 60 69 66 66 70L80 96H16L30 70C27 66 25 60 25 52Z"
            fill={hair}
          />
        )}

        {/* shoulders */}
        <path d="M12 96C14 77 29 68 48 68C67 68 82 77 84 96Z" fill={outfit} />
        {hairStyle !== "hijab" && <path d="M40 69L48 79L56 69" fill="none" stroke={accent} strokeWidth="3" strokeLinejoin="round" />}
        {hairStyle === "hijab" && <path d="M34 72C40 80 56 80 62 72" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />}

        {/* neck */}
        {hairStyle !== "hijab" && (
          <>
            <rect x="41" y="55" width="14" height="16" rx="6" fill={skin} />
            <rect x="41" y="58" width="14" height="5" fill="#000" opacity="0.07" />
          </>
        )}

        {/* ears */}
        {hairStyle !== "hijab" && (
          <>
            <circle cx="31.5" cy="46" r="3.6" fill={skin} />
            <circle cx="64.5" cy="46" r="3.6" fill={skin} />
          </>
        )}

        {/* face */}
        <ellipse cx="48" cy="44" rx={hairStyle === "hijab" ? 15.5 : 17} ry={hairStyle === "hijab" ? 17.5 : 19} fill={skin} />

        {/* hair on top */}
        {hairStyle === "bun" && (
          <>
            <circle cx="48" cy="18.5" r="7.5" fill={hair} />
            <path d="M30.5 45C29 29 38 23 48 23C58 23 67 29 65.5 45C63 36 57 31 48 31C39 31 33 36 30.5 45Z" fill={hair} />
          </>
        )}
        {hairStyle === "short" && (
          <path d="M30.5 42C29 27 38 21.5 49 21.5C60 21.5 67 28 65.5 41C64 35 61 31.5 56 30.5C49 33.5 39 33.5 32.5 36.5Z" fill={hair} />
        )}
        {hairStyle === "curly" && (
          <g fill={hair}>
            <circle cx="32" cy="38" r="6.5" />
            <circle cx="35.5" cy="29" r="7.5" />
            <circle cx="45" cy="24" r="8.5" />
            <circle cx="56" cy="25.5" r="8" />
            <circle cx="63.5" cy="33" r="7" />
            <circle cx="65" cy="41" r="5" />
          </g>
        )}
        {hairStyle === "long" && (
          <path d="M31 42C30 28 39 23 48 23C58 23 66 28 65 42C60 34 54 30 44 31C40 34 35 37 31 42Z" fill={hair} />
        )}

        {beard && (
          <path d="M31.5 46C32 60 40 66 48 66C56 66 64 60 64.5 46C62 54 56 57.5 48 57.5C40 57.5 34 54 31.5 46Z" fill={hair} />
        )}

        {/* features */}
        <g stroke={ink} strokeLinecap="round" fill="none">
          <path d="M37.5 40.5Q41 39 44 40.3" strokeWidth="1.5" opacity="0.55" />
          <path d="M52 40.3Q55 39 58.5 40.5" strokeWidth="1.5" opacity="0.55" />
          <path d="M48 47Q46.8 50.6 49.2 51" strokeWidth="1.3" opacity="0.35" />
          <path d={beard ? "M44.5 54.5Q48 56.6 51.5 54.5" : "M44 54.5Q48 58 52 54.5"} strokeWidth="1.7" opacity={beard ? 0.9 : 0.8} stroke={beard ? "#FFFDF8" : ink} />
        </g>
        <ellipse cx="41" cy="45.5" rx="1.7" ry="2.1" fill={ink} />
        <ellipse cx="55" cy="45.5" rx="1.7" ry="2.1" fill={ink} />
        <circle cx="37" cy="51.5" r="3.2" fill="#C0562F" opacity="0.14" />
        <circle cx="59" cy="51.5" r="3.2" fill="#C0562F" opacity="0.14" />
        {glasses && (
          <g fill="none" stroke={ink} strokeWidth="1.5" opacity="0.85">
            <circle cx="41" cy="45.5" r="5.2" />
            <circle cx="55" cy="45.5" r="5.2" />
            <path d="M46.2 45.2Q48 44 49.8 45.2" />
          </g>
        )}
      </g>
    </svg>
  );
}
