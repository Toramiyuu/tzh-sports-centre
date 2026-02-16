"use client";

import { ArrowRight, Clock, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

export function LocationSection() {
  const t = useTranslations("home.location");

  const contactInfo = [
    {
      icon: MapPin,
      title: t("address.title"),
      content: (
        <>
          {t("address.line1")}<br />{t("address.line2")}
        </>
      ),
      action: {
        label: t("address.directions"),
        href: "https://maps.app.goo.gl/xmtbgwLbfGoEUDWA9",
        external: true,
      },
    },
    {
      icon: Clock,
      title: t("hours.title"),
      content: (
        <>
          {t("hours.weekdays")}<br />{t("hours.weekends")}
        </>
      ),
    },
    {
      icon: Phone,
      title: t("contact.title"),
      content: (
        <>
          {t("contact.bookingsLabel")} <a href="tel:+60116868508" className="text-foreground hover:text-primary transition-colors">011-6868 8508</a><br />
          {t("contact.lessonsLabel")} <a href="tel:+60117575508" className="text-foreground hover:text-primary transition-colors">011-7575 8508</a>
        </>
      ),
    },
  ];

  return (
    <section className="py-16 md:py-32 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in duration-700 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t("badge")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground">
            {t("title")}
          </h2>
        </div>

        {/* Info cards row */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
          {contactInfo.map((info) => (
            <div
              key={info.title}
              className="rounded-2xl bg-card border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <info.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{info.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{info.content}</p>
              {info.action && (
                <a
                  href={info.action.href}
                  target={info.action.external ? "_blank" : undefined}
                  rel={info.action.external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 mt-3 transition-colors"
                >
                  {info.action.label} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-forwards">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1986.0259229585!2d100.29758!3d5.4090748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304ac300162c75fd%3A0x65461617c304bf30!2sTZH%20Badminton%20Academy!5e0!3m2!1sen!2smy!4v1705000000000"
            width="100%"
            height="300"
            className="md:h-[400px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

