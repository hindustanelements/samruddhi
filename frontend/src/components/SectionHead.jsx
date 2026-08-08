"use client";

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function SectionHead({ eyebrow, title, body, link }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
    <div><p className="eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2>{body && <p className="mt-3 max-w-xl text-sm leading-6 text-ink/60">{body}</p>}</div>
    {link && <Link to={link} className="flex items-center gap-2 text-sm font-bold text-forest">View all <ArrowRight size={17}/></Link>}
  </div>;
}
