'use client';

import Link from 'next/link';

interface ProjectCardProps {
  title: string;
  description: string;
  icon: string;
  link?: string;
  tags?: string[];
}

export default function ProjectCard({
  title,
  description,
  icon,
  link = '#',
  tags = [],
}: ProjectCardProps) {
  return (
    <Link href={link}>
      <div className="card-hover bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 cursor-pointer hover:border-blue-500 h-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-slate-300 text-sm mb-4">{description}</p>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="text-blue-400 font-semibold text-sm group-hover:translate-x-1 transition">
          Ver Proyecto →
        </div>
      </div>
    </Link>
  );
}
