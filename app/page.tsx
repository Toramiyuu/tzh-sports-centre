"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, MapPin, Phone, ChevronRight, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations('home');

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wider text-blue-200">
                {t('hero.subtitle')}
              </p>
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
                {t('hero.title')}
              </h1>
              <p className="mb-8 text-lg text-blue-100">
                {t('hero.description')}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/booking">
                  <Button size="lg" className="h-12 bg-white px-6 text-blue-700 hover:bg-blue-50">
                    {t('hero.bookCourt')}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/lessons">
                  <Button size="lg" className="h-12 border border-white/30 bg-transparent px-6 text-white hover:bg-white/10">
                    {t('hero.viewLessons')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-blue-500/30">
                <Image
                  src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"
                  alt="Badminton court"
                  fill
                  className="object-cover opacity-90"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">{t('sports.title')}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Badminton */}
            <Link href="/booking?sport=badminton" className="group relative overflow-hidden rounded-2xl cursor-pointer card-hover">
              <div className="aspect-[16/9] bg-blue-100">
                <Image
                  src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"
                  alt="Badminton"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="mb-1 text-2xl font-bold">{t('sports.badminton')}</h3>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> {t('sports.courts', { count: 4 })}
                  </span>
                  <span>{t('sports.perHour', { price: 15 })}</span>
                </div>
              </div>
            </Link>

            {/* Pickleball */}
            <Link href="/booking?sport=pickleball" className="group relative overflow-hidden rounded-2xl cursor-pointer card-hover">
              <div className="aspect-[16/9] bg-orange-100">
                <Image
                  src="https://images.unsplash.com/photo-1612534847738-b3af9bc31f0c?w=800&q=80"
                  alt="Pickleball"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="mb-1 text-2xl font-bold">{t('sports.pickleball')}</h3>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> {t('sports.courts', { count: 4 })}
                  </span>
                  <span>{t('sports.perHour', { price: 25 })} {t('sports.minHours', { hours: 2 })}</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900">{t('info.hours.title')}</h3>
              <p className="text-sm text-zinc-600">{t('info.hours.weekdays')}</p>
              <p className="text-sm text-zinc-600">{t('info.hours.weekends')}</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900">{t('info.location.title')}</h3>
              <p className="text-sm text-zinc-600">{t('info.location.address')}</p>
              <a
                href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-blue-600 hover:underline"
              >
                {t('info.location.directions')}
              </a>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900">{t('info.contact.title')}</h3>
              <p className="text-sm text-zinc-600">{t('info.contact.bookings')}</p>
              <p className="text-sm text-zinc-600">{t('info.contact.lessons')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lessons CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white md:p-12">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
              <div className="flex-1">
                <h2 className="mb-2 text-2xl font-bold">{t('cta.title')}</h2>
                <p className="text-blue-100">
                  {t('cta.description')}
                </p>
              </div>
              <Link href="/lessons">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  {t('cta.button')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
