"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Clock, MapPin, Phone, Star, Users, Zap, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-800 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
              Now Open for Bookings
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              TZH Sports Centre
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-green-100 sm:text-xl">
              Premium badminton and pickleball courts available for booking.
              Professional facilities, flexible hours, competitive rates.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/booking">
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50">
                  <Calendar className="mr-2 h-5 w-5" />
                  Book a Court
                </Button>
              </Link>
              <Link href="/lessons">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  View Lessons
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Why Choose Us?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-0 shadow-lg">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Premium Courts</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Well-maintained courts with professional-grade flooring and lighting
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Flexible Hours</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Open from 8 AM to 10 PM daily with easy online booking
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Instant Booking</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Book courts instantly online - no account required for guests
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section className="bg-white px-4 py-16 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Available Sports
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <h3 className="mb-2 text-2xl font-bold">Badminton</h3>
                <p className="text-blue-100">4 professional courts available</p>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Singles & Doubles
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> RM25/hour per court
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <h3 className="mb-2 text-2xl font-bold">Pickleball</h3>
                <p className="text-orange-100">4 courts available</p>
              </div>
              <CardContent className="p-6">
                <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> All skill levels welcome
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> RM25/hour per court
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Lessons CTA Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Card className="overflow-hidden border-0 bg-gradient-to-r from-green-600 to-green-700 shadow-xl">
            <CardContent className="flex flex-col items-center p-8 text-center text-white md:flex-row md:justify-between md:text-left">
              <div className="mb-6 md:mb-0">
                <h3 className="mb-2 text-2xl font-bold">Want to Improve Your Game?</h3>
                <p className="text-green-100">
                  Professional coaching available for all skill levels
                </p>
              </div>
              <Link href="/lessons">
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  View Lessons
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-zinc-900 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold">Visit Us</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-green-400" />
                  <div>
                    <p className="font-medium">TZH Sports Centre</p>
                    <p className="text-zinc-400">Penang, Malaysia</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-400" />
                  <p>012-757-58508</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-green-400" />
                  <p>Daily: 8:00 AM - 10:00 PM</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-end">
              <Link href="/booking">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  <Calendar className="mr-2 h-5 w-5" />
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 px-4 py-8 text-center text-zinc-400">
        <p>&copy; 2025 TZH Sports Centre. All rights reserved.</p>
      </footer>
    </div>
  );
}
