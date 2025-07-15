import { Cpu, Crown, MessagesSquare, PartyPopper, Sparkles } from "lucide-react";
import COVERS from "./categories";

export const NO_COVER_FALLBACK =
  "https://api.evento.so/storage/v1/render/image/public/cdn/eventos/default-covers/tech/15.webp";

export const DEFAULT_COVERS = COVERS;

export const COVER_FILTERS = [
  // { label: "Love", value: "LOVE" },
  { label: "Featured", value: "FEATURED", icon: Crown },
  { label: "Party", value: "PARTY", icon: PartyPopper },
  { label: "Social", value: "SOCIAL", icon: MessagesSquare },
  { label: "Classic", value: "CLASSIC", icon: Sparkles },
  { label: "Tech", value: "TECH", icon: Cpu },
];
