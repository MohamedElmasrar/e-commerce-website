"use client";

import { ChevronDown, Lock, LogIn, LogOut, Search, ShoppingCart, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Breadcrumb } from "./Breadcrumb";
import { Logo } from "./Logo";

function CartButton() {
  const { data: cart } = useCart();
  const count = cart?.totalQuantity ?? 0;
  return (
    <Link
      href="/cart"
      className={`notification notification--light cursor-pointer${count > 0 ? " notification--bullet" : ""}`}
      aria-label={`Cart, ${count} items`}
      title={`Cart (${count})`}
    >
      <ShoppingCart className="notification__icon dark:text-slate-500" />
    </Link>
  );
}

function SearchBox() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = term.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };
  return (
    <form className="intro-x relative mr-3 sm:mr-6" onSubmit={submit} role="search">
      <div className="search hidden sm:block">
        <input
          type="text"
          className="search__input form-control border-transparent"
          placeholder="Search products..."
          aria-label="Search products"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <Search className="search__icon dark:text-slate-500" />
      </div>
      <Link className="notification notification--light sm:hidden" href="/products" aria-label="Search products">
        <Search className="notification__icon dark:text-slate-500" />
      </Link>
    </form>
  );
}

function AccountMenu() {
  const { user, status, logout } = useAuth();
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);

  if (status !== "authenticated" || !user) {
    return (
      <div className="intro-x flex items-center">
        <Link href="/login" className="text-white mr-4 flex items-center">
          <LogIn className="w-4 h-4 mr-1" /> Login
        </Link>
        <Link href="/register" className="text-white flex items-center">
          <UserPlus className="w-4 h-4 mr-1" /> Register
        </Link>
      </div>
    );
  }

  const initial = user.fullName.trim().charAt(0).toUpperCase() || "?";

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      window.location.replace("/");
    } catch {
      toast.error("Logout could not be confirmed", "The server did not confirm that your session ended.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Dropdown
      menuClassName="w-56"
      placement="bottom-end"
      contentClassName="bg-primary/80 before:block before:absolute before:bg-black before:inset-0 before:rounded-md before:z-[-1] text-white"
      renderToggle={({ toggleProps }) => (
        <button
          {...toggleProps}
          type="button"
          disabled={signingOut}
          aria-label={signingOut ? "Logging out" : "Account menu"}
          className="flex items-center gap-1 text-white"
        >
          <span className="w-8 h-8 rounded-full shadow-lg bg-white text-primary flex items-center justify-center font-medium" aria-hidden="true">
            {initial}
          </span>
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <li className="p-2">
            <div className="font-medium">{user.fullName}</div>
            <div className="text-xs text-white/60 mt-0.5 dark:text-slate-500">{user.email}</div>
          </li>
          <li>
            <hr className="dropdown-divider border-white/[0.08]" />
          </li>
          <li>
            <Link href="/profile" className="dropdown-item hover:bg-white/5" onClick={close}>
              <User className="w-4 h-4 mr-2" /> Profile
            </Link>
          </li>
          <li>
            <Link href="/profile/password" className="dropdown-item hover:bg-white/5" onClick={close}>
              <Lock className="w-4 h-4 mr-2" /> Change Password
            </Link>
          </li>
          <li>
            <hr className="dropdown-divider border-white/[0.08]" />
          </li>
          <li>
            <button
              type="button"
              className="dropdown-item hover:bg-white/5 w-full"
              onClick={() => {
                close();
                void signOut();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </li>
        </>
      )}
    </Dropdown>
  );
}

export function TopBar() {
  return (
    <div className="top-bar-boxed h-[70px] z-[51] relative border-b border-white/[0.08] mt-12 md:-mt-5 -mx-3 sm:-mx-8 px-3 sm:px-8 md:pt-0 mb-12">
      <div className="h-full flex items-center">
        <Logo className="-intro-x hidden md:flex" />
        <Breadcrumb />
        <SearchBox />
        <div className="intro-x mr-4 sm:mr-6">
          <CartButton />
        </div>
        <AccountMenu />
      </div>
    </div>
  );
}
