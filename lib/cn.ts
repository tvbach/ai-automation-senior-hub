/** Nối className có điều kiện (thay cho clsx, không cần thêm dependency) */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
