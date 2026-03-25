"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Moon,
  Sun,
  CalendarDays,
  BookOpen,
  ShoppingBag,
  Trophy,
  GraduationCap,
  ClipboardList,
  Bell,
  Settings,
} from "lucide-react";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { UserMenu } from "@/components/UserMenu";
import { isAdmin } from "@/lib/admin";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { KineticNavOverlay, type KineticNavLink } from "@/components/ui/sterling-gate-kinetic-navigation";

const emptySubscribe = () => () => {};

export function Navbar() {
  const [kineticOpen, setKineticOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();

  const userIsAdmin = isAdmin(session?.user?.email, session?.user?.isAdmin);
  const t = useTranslations("nav");

  const kineticLinks: KineticNavLink[] = [
    { label: t("booking"), href: "/booking" },
    { label: t("lessons"), href: "/lessons" },
    { label: t("shop"), href: "/shop" },
    { label: "Stringing", href: "/stringing" },
    ...(session?.user ? [{ label: t("updates"), href: "/updates" }] : []),
    ...(session?.user?.isMember ? [{ label: t("leaderboard"), href: "/leaderboard" }] : []),
    ...(userIsAdmin ? [{ label: t("admin"), href: "/admin" }] : []),
  ];

  // Footer shown inside the kinetic overlay — includes theme, language, and auth
  const kineticFooter = (
    <div className="flex flex-wrap items-center gap-4">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        aria-label="Toggle theme"
      >
        {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <LanguageSwitcher />
      <div className="h-4 w-px bg-foreground/15" />
      {session?.user ? (
        <button
          onClick={() => { setKineticOpen(false); signOut({ callbackUrl: "/" }); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("logout")}
        </button>
      ) : (
        <>
          <Link href="/auth/login" onClick={() => setKineticOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t("login")}
          </Link>
          <Link href="/auth/register" onClick={() => setKineticOpen(false)} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            {t("signup")}
          </Link>
        </>
      )}
    </div>
  );

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-200 ${scrolled ? "bg-background/95 backdrop-blur-md border-border shadow-sm" : "bg-background border-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 outline-none focus:outline-none">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">TZH</span>
                </div>
                <span className="text-base font-semibold text-foreground font-display hidden sm:block">
                  TZH Sports Centre
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              <Link href="/booking" className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-xs xl:text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap">
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                {t("booking")}
              </Link>
              <Link href="/lessons" className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-xs xl:text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap">
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                {t("lessons")}
              </Link>
              <Link href="/shop" className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-xs xl:text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap">
                <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                {t("shop")}
              </Link>
              {session?.user?.isMember && (
                <Link href="/leaderboard" className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-xs xl:text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap">
                  <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
                  {t("leaderboard")}
                </Link>
              )}
              {session?.user?.isTrainee && (
                <Link href="/training" className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-xs xl:text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap">
                  <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                  {t("trainingSchedule")}
                </Link>
              )}
              {session?.user?.isTeacher && (
                <Link href="/teacher" className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-xs xl:text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap">
                  <ClipboardList className="w-3.5 h-3.5 flex-shrink-0" />
                  {t("teacherDashboard")}
                </Link>
              )}
              {session?.user && (
                <Link href="/updates" className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-xs xl:text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap">
                  <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                  {t("updates")}
                </Link>
              )}
              {userIsAdmin && (
                <Link href="/admin" className="flex items-center gap-1.5 px-2 xl:px-3 py-2 text-xs xl:text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap">
                  <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                  {t("admin")}
                </Link>
              )}
            </div>

            {/* Desktop right: theme, language, auth */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <LanguageSwitcher />
              {status === "loading" ? (
                <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
              ) : session?.user ? (
                <UserMenu />
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/10">
                      {t("login")}
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="text-sm bg-primary hover:bg-primary/90 text-white rounded-full px-4">
                      {t("signup")}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: hamburger → kinetic overlay directly */}
            <div className="lg:hidden flex items-center gap-1">
              <button
                onClick={() => setKineticOpen(true)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Kinetic overlay — mobile only trigger, but rendered for all (overlay is hidden by default) */}
      <KineticNavOverlay
        isOpen={kineticOpen}
        onClose={() => setKineticOpen(false)}
        links={kineticLinks}
        footer={kineticFooter}
      />
    </>
  );
}
