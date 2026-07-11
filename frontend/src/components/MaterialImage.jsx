import { Boxes, Droplets, FileStack, Leaf, Package, Recycle, Shirt, Wrench } from "lucide-react";

const visuals = {
  plastic: {
    icon: Recycle,
    bg: "from-emerald-100 via-sky-50 to-white",
    accent: "bg-emerald-600",
    shapes: ["left-7 top-8 h-20 w-9 rotate-[-8deg]", "left-20 top-12 h-24 w-10 rotate-[9deg]", "right-10 bottom-8 h-16 w-8 rotate-[-12deg]"]
  },
  metal: {
    icon: Wrench,
    bg: "from-slate-200 via-blue-50 to-white",
    accent: "bg-slate-600",
    shapes: ["left-7 top-8 h-8 w-28 rotate-[-12deg]", "left-20 top-24 h-8 w-32 rotate-[8deg]", "right-8 top-12 h-20 w-20 rounded-full"]
  },
  wood: {
    icon: Boxes,
    bg: "from-amber-100 via-lime-50 to-white",
    accent: "bg-amber-700",
    shapes: ["left-6 top-10 h-8 w-32 rotate-[-8deg]", "left-14 top-20 h-8 w-36 rotate-[5deg]", "right-8 bottom-8 h-8 w-28 rotate-[-3deg]"]
  },
  paper: {
    icon: FileStack,
    bg: "from-sky-100 via-white to-amber-50",
    accent: "bg-sky-600",
    shapes: ["left-8 top-8 h-24 w-20 rotate-[-9deg]", "left-20 top-12 h-24 w-20 rotate-[6deg]", "right-10 bottom-8 h-20 w-16 rotate-[10deg]"]
  },
  textile: {
    icon: Shirt,
    bg: "from-rose-100 via-indigo-50 to-white",
    accent: "bg-rose-600",
    shapes: ["left-8 top-10 h-20 w-28 rotate-[-9deg]", "right-9 top-16 h-24 w-24 rounded-full", "left-24 bottom-8 h-10 w-36 rotate-[6deg]"]
  },
  glass: {
    icon: Droplets,
    bg: "from-cyan-100 via-white to-emerald-50",
    accent: "bg-cyan-600",
    shapes: ["left-8 top-8 h-24 w-10 rotate-[-6deg]", "left-24 top-14 h-20 w-10 rotate-[8deg]", "right-10 bottom-8 h-20 w-20 rounded-full"]
  },
  organic: {
    icon: Leaf,
    bg: "from-lime-100 via-emerald-50 to-white",
    accent: "bg-lime-700",
    shapes: ["left-8 top-8 h-20 w-28 rounded-full rotate-[-20deg]", "right-12 top-16 h-24 w-20 rounded-full rotate-[25deg]", "left-24 bottom-8 h-10 w-28 rounded-full"]
  },
  other: {
    icon: Package,
    bg: "from-slate-100 via-white to-emerald-50",
    accent: "bg-brand-700",
    shapes: ["left-8 top-10 h-20 w-24 rotate-[-8deg]", "right-10 top-14 h-20 w-24 rotate-[8deg]", "left-24 bottom-8 h-10 w-32"]
  }
};

function visualFor(category = "") {
  const key = String(category).toLowerCase();
  if (key.includes("plastic")) return visuals.plastic;
  if (key.includes("metal")) return visuals.metal;
  if (key.includes("wood")) return visuals.wood;
  if (key.includes("paper")) return visuals.paper;
  if (key.includes("textile") || key.includes("fabric")) return visuals.textile;
  if (key.includes("glass")) return visuals.glass;
  if (key.includes("organic") || key.includes("food")) return visuals.organic;
  return visuals.other;
}

export default function MaterialImage({ material, className = "", compact = false }) {
  const image = material?.images?.[0];
  const title = material?.title || "Reusable waste material";
  const category = material?.category || "Other";
  const minHeight = compact ? "min-h-[96px]" : "min-h-[150px]";

  if (image) {
    return (
      <img
        src={assetUrl(image)}
        alt={`${title} material`}
        className={`h-full ${minHeight} w-full rounded-lg object-cover ${className}`}
        loading="lazy"
      />
    );
  }

  const visual = visualFor(category);
  const Icon = visual.icon;

  return (
    <div
      role="img"
      aria-label={`${category} material thumbnail for ${title}`}
      className={`relative ${minHeight} overflow-hidden rounded-lg bg-gradient-to-br ${visual.bg} ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_84%_74%,rgba(23,136,69,0.12),transparent_30%)]" />
      {visual.shapes.map((shape) => (
        <span key={shape} className={`absolute ${shape} rounded-lg ${visual.accent} opacity-20 shadow-subtle`} />
      ))}
      <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/90 text-brand-700 shadow-subtle">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="absolute inset-x-4 bottom-4 rounded-lg bg-white/90 p-4 shadow-subtle">
        <p className="text-xs font-extrabold uppercase text-muted">{category}</p>
        {!compact && <p className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 text-ink">{title}</p>}
      </div>
    </div>
  );
}

function assetUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  if (import.meta.env.PROD) return path;
  if (path.startsWith("/")) return `http://localhost:5000${path}`;
  return path;
}
