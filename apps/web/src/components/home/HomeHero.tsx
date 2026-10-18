import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";

// ponytail: foto MOCK (picsum) hasta tener fotografía real de campaña (REQUISITOS §6.3)
const HERO_IMAGE = "https://picsum.photos/seed/auzangate-hero/2400/1350";

// Hero a sangre, sin carrusel (design system §7.1). Coordenadas del apu arriba como dato técnico,
// titular abajo a la izquierda, una acción primaria y una secundaria.
export function HomeHero({
  title,
  data,
  primary,
  secondary,
}: {
  title: string;
  data: string;
  primary: { name: string; href: string };
  secondary: { name: string; href: string };
}) {
  return (
    <section className="relative h-[calc(100svh-88px)] min-h-[520px] overflow-hidden bg-granito text-nieve md:h-[calc(100svh-96px)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- ver ui/ProductPhoto */}
      <img src={HERO_IMAGE} alt="" width={2400} height={1350} fetchPriority="high" className="absolute inset-0 size-full object-cover opacity-70" />
      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-between px-4 pt-6 pb-10 md:px-8 md:pb-16">
        <p className="data tracking-[0.2em]">{data}</p>
        <div>
          <h1 className="display max-w-[11ch] text-[clamp(40px,9vw,168px)] [font-stretch:110%]">{title}</h1>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link href={primary.href} className="btn group bg-nieve text-granito hover:bg-roca-clara">
              {primary.name}
              <ArrowRight size={16} aria-hidden className="transition-transform duration-200 ease-(--ease-fluid) group-hover:translate-x-1" />
            </Link>
            <Link href={secondary.href} className="btn border border-nieve/60 hover:bg-nieve/10">
              {secondary.name}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
