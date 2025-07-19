"use client";

import { Globe, Instagram } from "lucide-react";
import { BitcoinSVGIcon } from "@/components/icons/bitcoin";
import { useState } from "react";
import WebsiteSheet from "./sheets/website-sheet";
import InstagramSheet from "./sheets/instagram-sheet";
import XSheet from "./sheets/x-sheet";
import LightningSheet from "./sheets/lightning-sheet";
import NostrSheet from "./sheets/nostr-sheet";

interface User {
  bio_link?: string;
  instagram_handle?: string;
  x_handle?: string;
  ln_address?: string;
  nip05?: string;
}

interface SocialLinksProps {
  user: User;
}

export default function SocialLinks({ user }: SocialLinksProps) {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // Helper to extract domain from URL
  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`)
        .hostname;
      return domain.replace("www.", "");
    } catch {
      return url;
    }
  };

  // Check if user has any social links
  const hasAnyLinks =
    user.bio_link ||
    user.instagram_handle ||
    user.x_handle ||
    user.ln_address ||
    user.nip05;

  if (!hasAnyLinks) {
    return null;
  }

  return (
    <>
      <div className="bg-gray-100 rounded-xl p-2.5 flex flex-wrap gap-1.5 -mx-2.5">
        {/* Website */}
        {user.bio_link && (
          <button
            onClick={() => setActiveSheet("website")}
            className="bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Globe className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-normal text-gray-900">
              {getDomainFromUrl(user.bio_link)}
            </span>
          </button>
        )}

        {/* Instagram */}
        {user.instagram_handle && (
          <button
            onClick={() => setActiveSheet("instagram")}
            className="bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Instagram className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-normal text-gray-900">
              @{user.instagram_handle}
            </span>
          </button>
        )}

        {/* X/Twitter */}
        {user.x_handle && (
          <button
            onClick={() => setActiveSheet("x")}
            className="bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm font-normal text-gray-900">
              @{user.x_handle}
            </span>
          </button>
        )}

        {/* Lightning */}
        {user.ln_address && (
          <button
            onClick={() => setActiveSheet("lightning")}
            className="bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <BitcoinSVGIcon className="h-4 w-4" fill="#f7931a" />
            <span className="text-sm font-normal text-gray-900">
              {user.ln_address.length > 20
                ? `${user.ln_address.substring(0, 20)}...`
                : user.ln_address}
            </span>
          </button>
        )}

        {/* Nostr */}
        {user.nip05 && (
          <button
            onClick={() => setActiveSheet("nostr")}
            className="bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="h-4 w-4 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">N</span>
            </div>
            <span className="text-sm font-normal text-gray-900">
              {user.nip05.length > 20
                ? `${user.nip05.substring(0, 20)}...`
                : user.nip05}
            </span>
          </button>
        )}
      </div>

      {/* Detached Sheets */}
      <WebsiteSheet
        isOpen={activeSheet === "website"}
        onClose={() => setActiveSheet(null)}
        url={user.bio_link || ""}
      />

      <InstagramSheet
        isOpen={activeSheet === "instagram"}
        onClose={() => setActiveSheet(null)}
        handle={user.instagram_handle || ""}
      />

      <XSheet
        isOpen={activeSheet === "x"}
        onClose={() => setActiveSheet(null)}
        handle={user.x_handle || ""}
      />

      <LightningSheet
        isOpen={activeSheet === "lightning"}
        onClose={() => setActiveSheet(null)}
        address={user.ln_address || ""}
      />

      <NostrSheet
        isOpen={activeSheet === "nostr"}
        onClose={() => setActiveSheet(null)}
        nip05={user.nip05 || ""}
      />
    </>
  );
}
