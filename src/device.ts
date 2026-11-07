// A coarse label for the device and browser, read from the user-agent.
// Only this label is kept, never the user-agent string itself.
export type DeviceKind = "phone" | "tablet" | "desktop";

export interface Device { kind: DeviceKind; label: string }

export function deviceOf(req: Request): Device {
  const ua = req.headers.get("User-Agent") ?? "";
  const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile\//.test(ua));
  const os = /iPhone/.test(ua) ? "iPhone" : ipad ? "iPad" : /Android/.test(ua) ? "Android" : /CrOS/.test(ua) ? "Chromebook"
    : /Windows/.test(ua) ? "Windows" : /Macintosh|Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Other";
  const kind: DeviceKind = os === "iPhone" || (os === "Android" && /Mobile/.test(ua)) ? "phone"
    : ipad || os === "Android" ? "tablet" : "desktop";
  const browser = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /OPR\/|Opera/.test(ua) ? "Opera"
    : /Firefox\/|FxiOS/.test(ua) ? "Firefox" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  // Apps that open links inside themselves often fail at sign-in, so name them.
  const app = /FBAN|FBAV/.test(ua) ? "Facebook" : /Instagram/.test(ua) ? "Instagram" : /LinkedInApp/.test(ua) ? "LinkedIn"
    : /Discord/.test(ua) ? "Discord" : /Line\//.test(ua) ? "Line" : "";
  return { kind, label: `${os} · ${app ? `${app} app browser` : browser}` };
}
