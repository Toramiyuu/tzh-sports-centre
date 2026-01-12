import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Clock, MapPin, BadgeCheck } from 'lucide-react'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Book Your Badminton Court Today
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              4 professional courts available for badminton and pickleball. Easy online reservations,
              instant confirmation. Open daily from 9 AM to 12 AM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/booking">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TZH Sports Centre?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the best badminton and pickleball experience with professional facilities
              and easy booking system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">4 Pro Courts</h3>
                <p className="text-gray-600 text-sm">
                  Professional-grade courts for badminton and pickleball
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Easy Booking</h3>
                <p className="text-gray-600 text-sm">
                  Book online in minutes with instant confirmation
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Long Hours</h3>
                <p className="text-gray-600 text-sm">
                  Open from 9 AM to 12 AM daily for your convenience
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Great Location</h3>
                <p className="text-gray-600 text-sm">
                  Conveniently located with ample parking space
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Affordable rates for everyone. Pay per hour, no membership required.
            </p>
          </div>

          {/* Badminton Pricing */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center text-blue-600 mb-6">Badminton</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-2 border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">Standard Courts</h3>
                  <p className="text-gray-600 mb-4">Courts 1, 2, 3</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">RM30</span>
                    <span className="text-gray-600">/hour</span>
                  </div>
                  <ul className="space-y-3 text-gray-600 mb-6">
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Professional court surface
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Standard lighting
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Equipment rental available
                    </li>
                  </ul>
                  <Link href="/booking">
                    <Button className="w-full">Book Now</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-500 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                    Premium
                  </span>
                </div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">Premium Court</h3>
                  <p className="text-gray-600 mb-4">Court 4</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">RM35</span>
                    <span className="text-gray-600">/hour</span>
                  </div>
                  <ul className="space-y-3 text-gray-600 mb-6">
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Professional court surface
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Enhanced LED lighting
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Priority booking
                    </li>
                  </ul>
                  <Link href="/booking">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pickleball Pricing */}
          <div>
            <h3 className="text-2xl font-bold text-center text-green-600 mb-6">Pickleball</h3>
            <div className="max-w-md mx-auto">
              <Card className="border-2 border-green-500">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">All Courts</h3>
                  <p className="text-gray-600 mb-4">Courts 1, 2, 3, 4</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">RM25</span>
                    <span className="text-gray-600">/hour</span>
                  </div>
                  <ul className="space-y-3 text-gray-600 mb-6 text-left">
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Convertible court setup
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Professional court surface
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                      Equipment rental available
                    </li>
                  </ul>
                  <Link href="/booking">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Play?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Book your court now and enjoy a great badminton or pickleball session with friends
            or family.
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <CalendarDays className="w-5 h-5 mr-2" />
              Book Your Court
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
