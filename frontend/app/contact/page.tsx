'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  MessageSquare,
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
      q: 'Is Jagri AI free for candidates and job seekers?',
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
      a: 'You can flag any vacancy directly using the contact form under "Report an Issue" or email us at support@jagriai.com for immediate investigation.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/70 via-blue-50/40 to-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-sky-100/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_50%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
         

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Get in Touch with Our Team
          </h1>

          <p className="max-w-2xl mx-auto text-slate-600 text-sm sm:text-base leading-relaxed">
            Have questions about posting a vacancy, need candidate assistance, or want to partner with Jagri AI? 
            We're here to help you every step of the way.
          </p>
        </div>
      </section>

      {/* Main Content: Info & Contact Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Direct Info & Operating Hours (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-xl font-bold text-slate-900">
                Contact Details
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Reach out to us through any of our official channels or fill out the inquiry form.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Headquarters
                    </h4>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      Kathmandu, Bagmati Province, Nepal
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email Inquiries
                    </h4>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      <a href="mailto:support@jagriai.com" className="hover:text-sky-600 transition-colors">
                        support@jagriai.com
                      </a>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <a href="mailto:careers@jagriai.com" className="hover:text-sky-600 transition-colors">
                        careers@jagriai.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Phone Number
                    </h4>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      +977 (01) 456-7890
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Support Hours
                    </h4>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      Sunday – Friday: 9:00 AM – 6:00 PM NPT
                    </p>
                    <p className="text-xs text-slate-500">
                      Closed on Saturdays & Public Holidays
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Promise Card */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50/60 rounded-2xl border border-sky-100 p-6 shadow-xs flex items-center gap-4">
              <ShieldCheck className="w-10 h-10 text-sky-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Rapid Support Guarantee
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  We respond to all candidate and employer inquiries within 24 business hours.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to Jagri AI. Our support specialists have received your message and will get back to you shortly.
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
                    className="mt-6 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900">
                      Send Us a Message
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Fill out the details below and we’ll route your inquiry to the right specialist.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="aarav@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Inquiry Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition cursor-pointer"
                      >
                        <option value="GENERAL">General Inquiries</option>
                        <option value="CANDIDATE">Candidate / Job Seeker Help</option>
                        <option value="EMPLOYER">Employer & Recruiter Inquiries</option>
                        <option value="BUG">Report an Issue / Technical</option>
                        <option value="PARTNERSHIP">Partnership & Media</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Brief summary of your inquiry"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please provide details about your request or questions..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-70 text-white font-semibold text-sm transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
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
      <section className="bg-white py-16 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Quick answers to common questions about using the Jagri AI platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4.5 h-4.5 text-sky-600 shrink-0 mt-0.5" />
                  <h4 className="text-sm font-bold text-slate-900">
                    {faq.q}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 pl-7 leading-relaxed">
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
