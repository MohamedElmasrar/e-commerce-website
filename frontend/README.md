# Frontend

Next.js (App Router) + TypeScript storefront. Styling is the precompiled Icewall/Midone CSS in `public/dist`
(no Tailwind install, no UI library, and the template's `dist/js/app.js` is never loaded).

## Commands

```
pnpm install
pnpm dev            # http://localhost:3000
pnpm build
pnpm lint
pnpm exec tsc --noEmit
pnpm test run
```

Copy `.env.example` to `.env.local`. `API_URL` is also read at build time by the `/api/v1` proxy rewrite
in `next.config.ts`, so set it before `pnpm build`.

## Layout of `src`

| Folder | Contents |
| --- | --- |
| `app/(shop)`, `app/(auth)`, `app/(admin)` | Route groups. Each is a root layout (`body.main` or `body.login`). `(admin)` wraps its pages in `RequireAdmin`. |
| `components/layout` | `AppShell`, `MobileMenu`, `SideNav`, `TopBar`, `Breadcrumb`, `Logo`, `RootDocument` |
| `components/ui` | React replacements for the `data-tw-*` behaviour: `Dropdown`, `Modal`, `ConfirmDialog`, `Collapse`/`Accordion`, `Tabs`, `Pagination`, `Toast`, plus `Skeleton`, `FormField`, `ErrorView` |
| `features/*` | Feature code (`catalog`, `auth`, `profile`, `cart`, `checkout`, `orders`, `shared`, and `admin/{dashboard,products,categories,inventory,orders,components}`), each with components and helpers |
| `lib/api` | Typed client (`client.ts`), per-domain modules, `types.ts` mirroring the backend DTOs, `ApiClientError` |
| `lib/query` | QueryClient factory and query option factories shared by server and client |
| `hooks` | `useAuth`, `useProducts`, `useProduct`, `useCategories`, `useCart` (optimistic), `useCheckout`, `useOrders`, `useProfile`, and the admin hooks `useAdminProducts`, `useAdminCategories`, `useAdminOrders`, `useInventory`, `useDashboardStats` |
| `providers` | `QueryProvider`, `AuthProvider`, `MutationErrorToaster` (global mutation error toast; opt out with `meta: { silent: true }`), `AppProviders` |
| `config` | Navigation and breadcrumb definitions |
| `styles` | `extras.css` with the few utilities missing from the precompiled template CSS |

## Auth

The access token is kept in memory only. The refresh token is the backend's httpOnly cookie. The browser calls the
API through the same-origin Next.js rewrite so the cookie is first-party. On a 401 the client refreshes once and retries.

## Checkout

`/checkout` posts the address to `POST /orders` (the server builds the order from its own cart), then calls
`POST /payments/checkout-session/{orderId}` and sends the browser to the Stripe URL. No amount is sent from the client.
The order id is kept in `sessionStorage` because the Stripe success and cancel URLs carry no id. `/checkout/success`
polls the order until the webhook moves it out of `PENDING_PAYMENT`.

## Rules

Components never call `fetch`; ESLint enforces it. All server state goes through `lib/api` and the hooks.
