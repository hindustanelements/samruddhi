import { Link } from "react-router-dom";

const defaultLogoImages = ["/samruddhi-transparent.png", "/samruddhi1-trimmed.png", "/samruddhi2-trimmed.png"];
const logoSizeClasses = ["h-full", "h-[115%]", "h-[145%]"];
const logoWidthClasses = ["w-[34%]", "w-[38%]", "w-[50%]"];
const logoGapClasses = ["ml-2 sm:ml-7", "ml-1 sm:ml-5", "ml-2 sm:ml-7"];

export default function Logo({ compact = false }) {
  return <Link to="/" className="group flex items-center" aria-label="Samruddhi home">
    <span className={`flex max-w-full items-center justify-center overflow-visible ${compact ? "h-20 w-[180px] sm:w-[240px]" : "h-20 w-full max-w-[360px]"}`}>
      {defaultLogoImages.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={index === 0 ? "Samruddhi" : ""}
          aria-hidden={index === 0 ? undefined : true}
          className={`shrink-0 object-contain ${logoWidthClasses[index]} ${logoSizeClasses[index]} ${logoGapClasses[index]}`}
          onError={(e) => { e.currentTarget.src = defaultLogoImages[index]; }}
        />
      ))}
    </span>
  </Link>;
}
