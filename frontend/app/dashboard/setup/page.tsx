'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api';
import {
  Briefcase,
  Building2,
  FileText,
  Phone,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileUp,
  X,
  Globe,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Check,
  GraduationCap
} from 'lucide-react';

export default function ProfileSetupPage() {
  const { user, refreshUser, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Wizard state: Step 1, 2, or 3
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Common Fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  // Job Seeker Fields
  const [resume, setResume] = useState<File | null>(null);
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Recruiter Fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Suggested skills for quick addition
  const suggestedSkills = [
    'Python', 'JavaScript', 'React', 'TypeScript', 'Node.js',
    'Django', 'SQL', 'Tailwind CSS', 'UI/UX Design', 'Project Management'
  ];

  // Initialize from user or redirect if already setup
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    if (user) {
      setUsername(user.username || '');
      if (user.is_staff || user.is_superuser) {
        router.replace('/dashboard/admin');
      }
    }
  }, [user, authLoading, router]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    };
  }, [photoPreview, logoPreview]);

  // Handle image selections
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture file size cannot exceed 2MB.');
      return;
    }
    const valid = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!valid.includes(file.type)) {
      setError('Please select a valid image file (.jpg, .jpeg, .png, .webp).');
      return;
    }

    setError(null);
    setProfilePicture(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Company logo file size cannot exceed 2MB.');
      return;
    }
    const valid = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!valid.includes(file.type)) {
      setError('Please select a valid image file (.jpg, .jpeg, .png, .webp).');
      return;
    }

    setError(null);
    setCompanyLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Resume file size cannot exceed 5MB.');
      return;
    }
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('Resume must be a PDF or Word document (.pdf, .doc, .docx).');
      return;
    }

    setError(null);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.resume;
      return copy;
    });
    setResume(file);
  };

  const handleAddSkillPill = (skillName: string) => {
    const existing = skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (!existing.includes(skillName)) {
      setSkills(existing.length > 0 ? `${skills}, ${skillName}` : skillName);
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.skills;
        return copy;
      });
    }
  };

  // Step-level validation
  const validateStep = (stepNumber: number): boolean => {
    const errors: Record<string, string> = {};
    setError(null);

    if (user?.role === 'JOB_SEEKER') {
      if (stepNumber === 1) {
        if (!username.trim()) {
          errors.username = 'Full name is required.';
        }
        // Phone and location are non-mandatory!
      } else if (stepNumber === 2) {
        if (!skills.trim()) {
          errors.skills = 'Please enter at least one key skill for AI matching.';
        }
      }
      // Step 3 is completely optional (photo, bio, education, experience)
    } else {
      // Recruiter
      if (stepNumber === 1) {
        if (!companyName.trim()) {
          errors.company_name = 'Company or organization name is required.';
        }
        if (!location.trim()) {
          errors.location = 'Headquarters or office location is required.';
        }
        // Phone is non-mandatory!
      }
      // Step 2 and 3 are optional (contact name, website, description, logo)
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please complete the required fields to continue.');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setError(null);
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submission handler
  const handleSubmit = async (isSkippingOptional = false) => {
    // Validate required steps 1 and 2
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();

      if (user?.role === 'JOB_SEEKER') {
        formData.append('username', username.trim());
        if (phone.trim()) formData.append('phone', phone.trim());
        formData.append('skills', skills.trim());
        if (resume) formData.append('resume', resume);

        if (!isSkippingOptional) {
          if (profilePicture) formData.append('profile_picture', profilePicture);
          if (bio.trim()) formData.append('bio', bio.trim());
          if (location.trim()) formData.append('location', location.trim());
          if (education.trim()) formData.append('education', education.trim());
          if (experience.trim()) formData.append('experience', experience.trim());
        }
      } else {
        // Recruiter
        formData.append('company_name', companyName.trim());
        if (phone.trim()) formData.append('phone', phone.trim());
        formData.append('location', location.trim());
        if (username.trim()) formData.append('username', username.trim());

        if (!isSkippingOptional) {
          if (companyLogo) formData.append('company_logo', companyLogo);
          if (companyWebsite.trim()) formData.append('company_website', companyWebsite.trim());
          if (companyDescription.trim()) formData.append('company_description', companyDescription.trim());
        }
      }

      await apiFetch('/profile/setup/', {
        method: 'POST',
        body: formData,
      });

      await refreshUser();
      setSuccess(true);

      setTimeout(() => {
        if (user?.role === 'JOB_RECRUITER') {
          router.replace('/dashboard/recruiter');
        } else {
          router.replace('/dashboard/seeker');
        }
      }, 1400);
    } catch (err: any) {
      console.error('Setup failed:', err);
      const serverErrors = err?.data || {};
      if (typeof serverErrors === 'object' && !Array.isArray(serverErrors)) {
        const newFieldErrors: Record<string, string> = {};
        for (const [key, val] of Object.entries(serverErrors)) {
          if (Array.isArray(val) && val.length > 0) {
            newFieldErrors[key] = String(val[0]);
          }
        }
        setFieldErrors(newFieldErrors);
      }
      setError(err?.data?.detail || err?.message || 'Failed to complete profile setup. Please check the fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-10 h-10 rounded-full border-3 border-sky-600 border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Preparing account setup...</p>
      </div>
    );
  }

  const isJobSeeker = user.role === 'JOB_SEEKER';

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-8 sm:py-12 select-none transition-colors duration-200">
      {/* Top Minimal Bar */}
      <header className="w-full max-w-xl flex items-center justify-between mb-4 px-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Jagir<span className="text-sky-600 dark:text-sky-400">AI</span>
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Center Google-Style Card */}
      <main className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-[28px] shadow-2xl shadow-slate-200/60 dark:shadow-black/50 overflow-hidden transition-all duration-300">
        {/* Animated Google Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-7 sm:p-10">
          {/* Success Screen */}
          {success ? (
            <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                You&apos;re all set!
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Your profile has been successfully configured. Taking you to your dashboard now...
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-7 h-7 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
              </div>
            </div>
          ) : (
            <div>
              {/* Account Identifier Chip (Google Account Identity Pill) */}
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[85%] truncate">
                  <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.username ? user.username[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                  <span className="truncate">{user.email}</span>
                </div>

                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>

              {/* Dynamic Step Headers */}
              {isJobSeeker ? (
                <div className="mb-8">
                  {currentStep === 1 && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Basic Information
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                        Enter your primary contact details to begin setting up your candidate profile.
                      </p>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Resume & Core Skills
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                        Highlight your key skills and optionally attach your CV for automated AI matching.
                      </p>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Profile Photo & Bio
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                        Add finishing touches to stand out to employers. You can skip this step if you prefer.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="mb-8">
                  {currentStep === 1 && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Company Profile
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                        Enter your company information to publish verified job vacancies.
                      </p>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Presence & Recruiter Info
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                        Add details about your organization so applicants know who you are.
                      </p>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Company Branding
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                        Upload your official logo. You can skip this and add it later anytime.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* General Error Banner */}
              {error && (
                <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP FORM CONTENTS */}
              {isJobSeeker ? (
                /* ================= JOB SEEKER STEPS ================= */
                <div>
                  {/* STEP 1: Personal Info */}
                  {currentStep === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Full Name / Display Name
                          </label>
                          <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400">
                            Required
                          </span>
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            if (fieldErrors.username) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.username;
                                return copy;
                              });
                            }
                          }}
                          placeholder="e.g. Ashim Silwal"
                          className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition ${
                            fieldErrors.username
                              ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                              : 'border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10'
                          }`}
                        />
                        {fieldErrors.username && (
                          <p className="mt-1.5 text-xs text-rose-500 font-medium">{fieldErrors.username}</p>
                        )}
                      </div>

                      {/* Phone (NON MANDATORY) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Contact Phone
                          </label>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Optional
                          </span>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +977 98XXXXXXXX"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition"
                        />
                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Non-mandatory. Used only if recruiters want to reach you by phone.
                        </p>
                      </div>

                      {/* Location */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Location / City
                          </label>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Optional
                          </span>
                        </div>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Kathmandu, Nepal or Remote"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Resume & Core Skills */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* Resume Upload */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Upload Resume / CV
                          </label>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Optional
                          </span>
                        </div>

                        <input
                          type="file"
                          ref={resumeInputRef}
                          onChange={handleResumeSelect}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                        />

                        {resume ? (
                          <div className="flex items-center justify-between p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {resume.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {(resume.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setResume(null);
                                if (resumeInputRef.current) resumeInputRef.current.value = '';
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                              title="Remove resume"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => resumeInputRef.current?.click()}
                            className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${
                              fieldErrors.resume
                                ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20'
                                : 'border-slate-300 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50/20 dark:hover:bg-sky-950/10'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2">
                              <FileUp className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              Click to choose resume
                            </span>
                            <span className="text-[11px] text-slate-500 mt-1">
                              Optional • PDF, DOC, or DOCX (Max 5MB)
                            </span>
                          </div>
                        )}
                        {fieldErrors.resume && (
                          <p className="mt-1.5 text-xs text-rose-500 font-medium">{fieldErrors.resume}</p>
                        )}
                      </div>

                      {/* Skills Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Key Skills
                          </label>
                          <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400">
                            Required
                          </span>
                        </div>

                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => {
                            setSkills(e.target.value);
                            if (fieldErrors.skills) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.skills;
                                return copy;
                              });
                            }
                          }}
                          placeholder="e.g. Python, React, Tailwind CSS, Django"
                          className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition ${
                            fieldErrors.skills
                              ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                              : 'border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10'
                          }`}
                        />
                        {fieldErrors.skills && (
                          <p className="mt-1.5 text-xs text-rose-500 font-medium">{fieldErrors.skills}</p>
                        )}

                        {/* Suggested Skill Pills */}
                        <div className="mt-2.5">
                          <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Quick suggestions:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestedSkills.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleAddSkillPill(s)}
                                className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-950/60 dark:hover:text-sky-300 text-slate-600 dark:text-slate-400 transition cursor-pointer"
                              >
                                + {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Profile Photo & Bio (Optional & Skippable) */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* Photo Upload */}
                      <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                        <input
                          type="file"
                          ref={photoInputRef}
                          onChange={handlePhotoSelect}
                          accept="image/*"
                          className="hidden"
                        />

                        <div className="relative group mb-3">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-sky-500/30 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                            {photoPreview ? (
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 rounded-full bg-sky-600 text-white shadow-md hover:bg-sky-500 transition"
                            title="Upload photo"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            {photoPreview ? 'Change Photo' : 'Upload Profile Picture'}
                          </button>
                          {photoPreview && (
                            <>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setProfilePicture(null);
                                  setPhotoPreview(null);
                                  if (photoInputRef.current) photoInputRef.current.value = '';
                                }}
                                className="text-xs font-semibold text-rose-500 hover:underline"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Optional • JPG, PNG or WebP up to 2MB
                        </p>
                      </div>

                      {/* Bio */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Bio / About You
                          </label>
                          <span className="text-[11px] font-medium text-slate-400">
                            Optional
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Briefly describe your experience and career aspirations..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition resize-none"
                        />
                      </div>

                      {/* Education & Experience */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                            Education
                          </label>
                          <input
                            type="text"
                            value={education}
                            onChange={(e) => setEducation(e.target.value)}
                            placeholder="e.g. B.Sc. CSIT"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                            Experience
                          </label>
                          <input
                            type="text"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            placeholder="e.g. 2 years Software Eng"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ================= RECRUITER STEPS ================= */
                <div>
                  {/* STEP 1: Company Profile */}
                  {currentStep === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Company / Organization Name
                          </label>
                          <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400">
                            Required
                          </span>
                        </div>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => {
                            setCompanyName(e.target.value);
                            if (fieldErrors.company_name) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.company_name;
                                return copy;
                              });
                            }
                          }}
                          placeholder="e.g. Acme Innovations Corp"
                          className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition ${
                            fieldErrors.company_name
                              ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                              : 'border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10'
                          }`}
                        />
                        {fieldErrors.company_name && (
                          <p className="mt-1.5 text-xs text-rose-500 font-medium">{fieldErrors.company_name}</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Headquarters / Office Location
                          </label>
                          <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400">
                            Required
                          </span>
                        </div>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => {
                              setLocation(e.target.value);
                              if (fieldErrors.location) {
                                setFieldErrors((prev) => {
                                  const copy = { ...prev };
                                  delete copy.location;
                                  return copy;
                                });
                              }
                            }}
                            placeholder="e.g. Kathmandu, Nepal or Remote"
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition ${
                              fieldErrors.location
                                ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10'
                            }`}
                          />
                        </div>
                        {fieldErrors.location && (
                          <p className="mt-1.5 text-xs text-rose-500 font-medium">{fieldErrors.location}</p>
                        )}
                      </div>

                      {/* Phone (NON MANDATORY) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Official Contact Phone
                          </label>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Optional
                          </span>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +977 1 4XXXXXX"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition"
                        />
                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Non-mandatory. Your company contact line.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Company Presence & Recruiter Contact */}
                  {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Recruiter Contact Person
                          </label>
                          <span className="text-[11px] font-medium text-slate-400">
                            Optional
                          </span>
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. Talent Acquisition Lead"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Company Website
                          </label>
                          <span className="text-[11px] font-medium text-slate-400">
                            Optional
                          </span>
                        </div>
                        <div className="relative">
                          <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type="url"
                            value={companyWebsite}
                            onChange={(e) => setCompanyWebsite(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Company Overview & Mission
                          </label>
                          <span className="text-[11px] font-medium text-slate-400">
                            Optional
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={companyDescription}
                          onChange={(e) => setCompanyDescription(e.target.value)}
                          placeholder="Tell candidates about your company values, products, and culture..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Company Logo & Branding (Optional & Skippable) */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoSelect}
                          accept="image/*"
                          className="hidden"
                        />

                        <div className="relative group mb-3">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                            {logoPreview ? (
                              <img
                                src={logoPreview}
                                alt="Company Logo"
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <Building2 className="w-10 h-10 text-slate-400" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 p-2 rounded-full bg-sky-600 text-white shadow-md hover:bg-sky-500 transition"
                            title="Upload company logo"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            {logoPreview ? 'Change Logo' : 'Upload Company Logo'}
                          </button>
                          {logoPreview && (
                            <>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCompanyLogo(null);
                                  setLogoPreview(null);
                                  if (logoInputRef.current) logoInputRef.current.value = '';
                                }}
                                className="text-xs font-semibold text-rose-500 hover:underline"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs">
                          Optional • Square format recommended (JPG, PNG, or WebP up to 2MB).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CARD FOOTER: Google-Style Actions */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div />
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Step 3 Optional Skip Button */}
                  {currentStep === 3 && (
                    <button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      disabled={saving}
                      className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Skip for now
                    </button>
                  )}

                  {/* Next vs Finish Button */}
                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:scale-98 shadow-sm shadow-sky-500/20 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSubmit(false)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:scale-98 shadow-md shadow-sky-500/25 transition disabled:opacity-60 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Saving profile...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Finish Setup</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Google-Style Bottom Footer (Help, Privacy, Terms, Sign out) */}
      <footer className="w-full max-w-xl mt-6 px-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-3">
        <div className="flex items-center gap-1.5">
          <span>Jagir AI Identity & Profile Setup</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('Do you want to sign out and complete your profile later?')) {
                await logout();
                router.replace('/login');
              }
            }}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign out</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
