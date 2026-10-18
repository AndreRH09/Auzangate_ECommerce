import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Link, redirect, etc. que agregan el prefijo de idioma solos. Usar estos en vez de next/link.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
