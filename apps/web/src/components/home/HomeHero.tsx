import { Link } from "@/i18n/navigation";

// ponytail: foto MOCK (picsum) hasta tener fotografía real de campaña (REQUISITOS §6.3)
const HERO_IMAGE = "https://picsum.photos/seed/auzangate-hero/2400/1350";

// Hero a sangre, sin carrusel; titular abajo a la izquierda (design system §7.1)
export function HomeHero({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  return (
    <section className="relative h-[calc(100svh-56px)] min-h-[480px] overflow-hidden bg-granito md:h-[calc(100svh-64px)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- ver ui/ProductPhoto */}
      <img src={HERO_IMAGE} alt="" width={2400} height={1350} fetchPriority="high" className="absolute inset-0 size-full object-cover opacity-80" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-4 pb-10 text-nieve md:px-8 md:pb-16">
        <h1 className="display max-w-[12ch] text-[clamp(44px,9vw,160px)] [font-stretch:110%]">{title}</h1>
        <div className="mt-6 flex gap-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex h-cta items-center rounded-md bg-nieve px-6 font-semibold text-granito">
              {l.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
