import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Poppins, Lexend } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ToastProvider } from '@/context/ToastContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AppShell } from '@/components/AppShell';
import { ForcePasswordChangeModal } from '@/components/ForcePasswordChangeModal';
import { ToastContainer } from '@/components/ToastContainer';
import {
  SkipToContent,
  AccessibilityButton,
  AccessibilityPanel,
  ReadingGuide,
  ReadingMask,
  LiveAnnouncer,
} from '@/components/accessibility';

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend',
});

export const metadata: Metadata = {
  title: 'Jagir AI - Modern Recruitment Platform',
  description: 'Connecting top talent with leading companies powered by intelligent recruitment features.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${poppins.variable} ${lexend.variable} ${GeistSans.className} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  /* Theme Restoration */
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  /* Accessibility Preferences Restoration */
                  var a11yRaw = localStorage.getItem('jagir_a11y_settings');
                  if (a11yRaw) {
                    var s = JSON.parse(a11yRaw);
                    var root = document.documentElement;
                    if (s.textSize && s.textSize !== 100) {
                      root.setAttribute('data-a11y-text-scale', s.textSize.toString());
                      root.style.setProperty('--a11y-font-scale', (s.textSize / 100).toString());
                    }
                    if (s.highContrast) root.classList.add('a11y-high-contrast');
                    if (s.dyslexicFont) root.classList.add('a11y-dyslexic-font');
                    if (s.highlightLinks) root.classList.add('a11y-highlight-links');
                    if (s.underlineLinks) root.classList.add('a11y-underline-links');
                    if (s.reducedMotion) root.classList.add('a11y-reduced-motion');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <AccessibilityProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <SidebarProvider>
                  {/* Top-Center Floating Save / Action Notification Popup */}
                  <ToastContainer />

                  {/* Skip to Content for Keyboard/Screen Reader Navigation */}
                  <SkipToContent />
                  <LiveAnnouncer />

                  {/* Visual Reading Aids */}
                  <ReadingGuide />
                  <ReadingMask />

                  {/* Navigation Header */}
                  <Navbar />

                  {/* Main Shell */}
                  <AppShell>
                    <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
                      {children}
                    </main>
                  </AppShell>

                  {/* Footer */}
                  <Footer />

                  {/* Force Password Change Modal for one-time temporary passwords */}
                  <ForcePasswordChangeModal />

                  {/* Floating Accessibility Control & Panel */}
                  <AccessibilityButton />
                  <AccessibilityPanel />
                </SidebarProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}

