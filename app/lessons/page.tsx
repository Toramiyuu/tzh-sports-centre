import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Clock,
  BadgeCheck,
  Phone,
  GraduationCap,
  Star,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

const lessonTypes = [
  {
    name: '1-to-1 Private',
    description: 'Personalized coaching focused entirely on you',
    price: 130,
    duration: '1.5 hours',
    students: 1,
    popular: false,
  },
  {
    name: '1-to-2',
    description: 'Learn with a partner, share the experience',
    price: 160,
    duration: '1.5 hours',
    students: 2,
    popular: true,
  },
  {
    name: '1-to-3',
    description: 'Small group training with focused attention',
    price: 180,
    duration: '2 hours',
    students: 3,
    popular: false,
  },
  {
    name: '1-to-4',
    description: 'Group sessions for friends or family',
    price: 200,
    duration: '2 hours',
    students: 4,
    popular: false,
  },
]

const skillLevels = [
  {
    level: 'Beginner',
    description: 'New to badminton? Learn the fundamentals, grip, footwork, and basic strokes.',
    color: 'bg-green-100 text-green-700',
  },
  {
    level: 'Intermediate',
    description: 'Ready to improve? Focus on technique refinement, tactics, and game strategy.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    level: 'Advanced',
    description: 'Take it to the next level with advanced techniques and competitive training.',
    color: 'bg-purple-100 text-purple-700',
  },
]

export default function LessonsPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <Badge className="bg-white/20 text-white mb-4">
              <GraduationCap className="w-4 h-4 mr-1" />
              Professional Coaching
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Badminton Lessons
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Learn from certified coaches and take your game to the next level.
              Suitable for all ages and skill levels.
            </p>
            <a href="https://wa.me/601275758508" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Phone className="w-5 h-5 mr-2" />
                Enquire Now
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Lesson Packages */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lesson Packages
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the lesson format that works best for you. All packages include court booking and training shuttlecocks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {lessonTypes.map((lesson) => (
              <Card
                key={lesson.name}
                className={`relative border-2 ${lesson.popular ? 'border-blue-500' : 'border-gray-200'}`}
              >
                {lesson.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-lg">{lesson.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{lesson.description}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">RM{lesson.price}</span>
                    <span className="text-gray-500 text-sm"> / session</span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {lesson.duration}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {lesson.students} {lesson.students === 1 ? 'student' : 'students'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Levels */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              All Skill Levels Welcome
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you&apos;re picking up a racket for the first time or training for competition,
              we have coaching tailored for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {skillLevels.map((skill) => (
              <Card key={skill.level} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Badge className={`${skill.color} mb-4`}>
                    {skill.level}
                  </Badge>
                  <p className="text-gray-600 text-sm">{skill.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              <Sparkles className="w-4 h-4 inline mr-1 text-blue-500" />
              Suitable for both <strong>kids</strong> and <strong>adults</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Coach Credentials */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Certified Coaches
            </h2>
            <p className="text-gray-600 mb-8">
              Our coaches are professionally certified and passionate about helping you improve.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-lg shadow-md">
                <BadgeCheck className="w-8 h-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">BAM Certified</p>
                  <p className="text-sm text-gray-600">Badminton Association of Malaysia</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-lg shadow-md">
                <GraduationCap className="w-8 h-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Level 1 Certification</p>
                  <p className="text-sm text-gray-600">Professional Coaching Qualification</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What&apos;s Included
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Court Booking</h3>
                <p className="text-gray-600 text-sm">
                  Court rental is included in all lesson packages
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Training Shuttlecocks</h3>
                <p className="text-gray-600 text-sm">
                  Shuttlecocks provided for all training sessions
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Trial Available</h3>
                <p className="text-gray-600 text-sm">
                  Try a session at the normal lesson rate
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Contact us to book your lesson or enquire about our coaching programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/601275758508" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Phone className="w-5 h-5 mr-2" />
                WhatsApp: 012-7575 8508
              </Button>
            </a>
            <Link href="/booking">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Book a Court
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
