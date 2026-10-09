'use client';

import React, { useState } from 'react';
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'GENERAL',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate submission delay
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  const faqs = [
    {
      q: 'Is Jagir AI free for candidates and job seekers?',
      a: 'Yes, searching for open vacancies, building a candidate profile, and submitting applications is 100% free for all job seekers.'
    },
    {
      q: 'How long does recruiter profile verification take?',
      a: 'Our operations team typically verifies and activates company employer profiles within 2 to 4 business hours.'
    },
    {
      q: 'Can I track the status of my submitted applications?',
      a: 'Absolutely. Log in to your Job Seeker Dashboard at any time to monitor review stages, interview invitations, and status notes in real time.'
    },
    {
      q: 'How do I report an issue or fraudulent listing?',
      a: 'You can flag any vacancy directly using the contact form under "Report an Issue" or email us at support@jagirai.com for immediate investigation.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/70 via-blue-50/40 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 py-16 px-4 sm:px-6 lg:px-8 border-b border-sky-100/80 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_50%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Get in Touch with Our Team
          </h1>

          <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Have questions about posting a vacancy, need candidate assistance, or want to partner with Jagir AI? 
            We're here to help you every step of the way.
          </p>
        </div>
      </section>

      {/* Main Content: Info & Contact Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Direct Info & Operating Hours (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Contact Details
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Reach out to us through any of our official channels or fill out the inquiry form.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-md bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Headquarters
                    </h4>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      Kathmandu, Bagmati Province, Nepal
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-md bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Email Inquiries
                    </h4>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      <a href="mailto:support@jagirai.com" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        support@jagirai.com
                      </a>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <a href="mailto:careers@jagirai.com" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                        careers@jagirai.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-md bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Phone Number
                    </h4>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      +977 (01) 456-7890
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-md bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Support Hours
                    </h4>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      Sunday – Friday: 9:00 AM – 6:00 PM NPT
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Closed on Saturdays & Public Holidays
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Promise Card */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50/60 dark:from-sky-950/40 dark:to-blue-950/40 rounded-lg border border-sky-100 dark:border-sky-800/60 p-6 shadow-sm flex items-center gap-4">
              <ShieldCheck className="w-10 h-10 text-sky-600 dark:text-sky-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Rapid Support Guarantee
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  We respond to all candidate and employer inquiries within 24 business hours.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to Jagir AI. Our support specialists have received your message and will get back to you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        category: 'GENERAL',
                        subject: '',
                        message: ''
                      });
                    }}
                    className="mt-6 px-6 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Send Us a Message
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Fill out the details below and we’ll route your inquiry to the right specialist.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="aarav@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Inquiry Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition cursor-pointer"
                      >
                        <option value="GENERAL" className="dark:bg-slate-900">General Inquiries</option>
                        <option value="CANDIDATE" className="dark:bg-slate-900">Candidate / Job Seeker Help</option>
                        <option value="EMPLOYER" className="dark:bg-slate-900">Employer & Recruiter Inquiries</option>
                        <option value="BUG" className="dark:bg-slate-900">Report an Issue / Technical</option>
                        <option value="PARTNERSHIP" className="dark:bg-slate-900">Partnership & Media</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Brief summary of your inquiry"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please provide details about your request or questions..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-70 text-white font-semibold text-sm transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white dark:bg-slate-900/90 py-16 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Quick answers to common questions about using the Jagir AI platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-slate-600 transition-all shadow-sm space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-100/80 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 border border-sky-200/60 dark:border-sky-800/80">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-0.5">
                    {faq.q}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-9 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
