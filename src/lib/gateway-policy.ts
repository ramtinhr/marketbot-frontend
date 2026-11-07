// Deliberately limited proxy surface; no arbitrary upstream URL or admin APIs.
export function allowedRoute(method: string, path: string): boolean {
  const routes: Record<string, RegExp[]> = {
    GET: [
      /^crypto\/(assets|deposits|withdrawals)$/,
      /^me$/,
      /^wallet$/,
      /^wallet\/entries$/,
      /^wallet\/charge$/,
      /^wallet\/withdrawals$/,
      /^bank-accounts$/,
      /^market\/symbols$/,
      /^market\/[A-Z0-9_]+$/,
      /^orders$/,
      /^trades$/,
      /^auction\/[A-Z0-9_]+$/,
      /^auction\/orders$/,
    ],
    POST: [
      /^crypto\/(deposit-address|deposits|withdrawals)$/,
      /^crypto\/withdrawals\/[a-zA-Z0-9-]+\/cancel$/,
      /^auth\/web\/(send|verify)$/,
      /^auth\/logout$/,
      /^auth\/otp\/(send|verify)$/,
      /^orders$/,
      /^orders\/[a-zA-Z0-9-]+\/cancel$/,
      /^wallet\/charge$/,
      /^wallet\/withdrawals(\/otp)?$/,
      /^wallet\/withdrawals\/[a-zA-Z0-9-]+\/cancel$/,
      /^bank-accounts$/,
      /^auction\/orders$/,
      /^auction\/orders\/[a-zA-Z0-9-]+\/cancel$/,
      /^auction\/offers\/[a-zA-Z0-9-]+\/take$/,
    ],
    DELETE: [/^bank-accounts\/[a-zA-Z0-9-]+$/],
  };
  return routes[method]?.some((route) => route.test(path)) ?? false;
}
