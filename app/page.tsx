"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, MapPin, Phone, ChevronRight, Users } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wider text-blue-200">
                Court Booking
              </p>
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
                TZH Sports Centre
              </h1>
              <p className="mb-8 text-lg text-blue-100">
                Badminton and pickleball courts available for booking.
                No account required.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/booking">
                  <Button size="lg" className="h-12 bg-white px-6 text-blue-700 hover:bg-blue-50">
                    Book a Court
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/lessons">
                  <Button size="lg" className="h-12 border border-white/30 bg-transparent px-6 text-white hover:bg-white/10">
                    View Lessons
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
          <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">Available Sports</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Badminton */}
            <div className="group relative overflow-hidden rounded-2xl">
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
                <h3 className="mb-1 text-2xl font-bold">Badminton</h3>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> 4 courts
                  </span>
                  <span>RM15/hr</span>
                </div>
              </div>
            </div>

            {/* Pickleball */}
            <div className="group relative overflow-hidden rounded-2xl">
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
                <h3 className="mb-1 text-2xl font-bold">Pickleball</h3>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> 4 courts
                  </span>
                  <span>RM25/hr (2hr min)</span>
                </div>
              </div>
            </div>
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
              <h3 className="mb-2 font-semibold text-zinc-900">Open Daily</h3>
              <p className="text-sm text-zinc-600">8:00 AM - 10:00 PM</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900">Location</h3>
              <p className="text-sm text-zinc-600">Jalan Sekolah La Salle, Ayer Itam</p>
              <a
                href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-blue-600 hover:underline"
              >
                Get Directions
              </a>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900">Contact</h3>
              <p className="text-sm text-zinc-600">011-6868 8508</p>
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
                <h2 className="mb-2 text-2xl font-bold">Want to improve your game?</h2>
                <p className="text-blue-100">
                  Professional coaching available. BAM Certified coach with Level 1 Certification.
                </p>
              </div>
              <Link href="/lessons">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  View Lessons
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 px-4 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-zinc-500">
          <p>&copy; 2025 TZH Sports Centre</p>
        </div>
      </footer>
    </div>
  );
}
