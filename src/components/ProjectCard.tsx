'use client';

import Link from 'next/link';

interface ProjectCardProps {
  numero: string;
  title: string;
  description: string;
  icon: string;
  link?: string;
  tags?: string[];
}

export default function ProjectCard({
  numero,
  title,
  description,
  icon,
  link = '#',
  tags = [],
}: ProjectCardProps) {
  return (
    <Link href={link} className="group block h-full">
      <div className="relative h-full rounded-2xl border border-slate-700 bg-slate-800/50 p-7 shadow-xl transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-blue-500/60 hover:shadow-[0_20px_45px_rgba(59,130,246,0.18)]">
        <div className="flex items-start justify-between mb-5">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Capítulo {numero}</span>
          <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-2xl text-blue-400 shadow-inner transition-all duration-300 group-hover:border-blue-500/60 group-hover:text-blue-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]">
            {icon}
          </div>
        </div>

        <h3 className="text-xl font-bold mb-3 text-white leading-snug">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">{description}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-full border border-blue-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
          Ver capítulo
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
        </div>
      </div>
    </Link>
  );
}
