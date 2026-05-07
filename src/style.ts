// Gate ANSI styling on stdout being a TTY. Without this, escape codes leak
// verbatim when output is captured (e.g. Vim's `:!`, pipes, log files).
// FORCE_COLOR=0 also disables; FORCE_COLOR=1+ forces on.

function enabled(): boolean {
  const force = process.env.FORCE_COLOR;
  if (force === "0") return false;
  if (force && force !== "") return true;
  return process.stdout.isTTY === true;
}

const wrap = (open: string, close: string) => (s: string) =>
  enabled() ? `${open}${s}${close}` : s;

export const dim = wrap("\x1b[2m", "\x1b[0m");
export const red = wrap("\x1b[31m", "\x1b[0m");
export const green = wrap("\x1b[32m", "\x1b[0m");
export const yellow = wrap("\x1b[33m", "\x1b[0m");
export const cyan = wrap("\x1b[36m", "\x1b[0m");
export const underline = wrap("\x1b[4m", "\x1b[24m");

export function link(url: string, text: string = url): string {
  return enabled() ? `\x1b]8;;${url}\x07${text}\x1b]8;;\x07` : text;
}

export function clearLine(): string {
  return enabled() ? "\x1b[2K\r" : "";
}
