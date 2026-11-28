// pages/terms.tsx
'use client';

import Header from "@components/header/page";

export default function TermsPage() {
  const sections = [
    {
      title: "Introduction",
      content: "Welcome to reNote. By using our services, you agree to be bound by these Terms & Conditions. Please read them carefully.",
    },
    {
      title: "Acceptance of Terms",
      content: "By using our application, you accept these terms in full. If you do not agree with any part of these terms, please do not use our services.",
    },
    {
      title: "Use of the Service",
      content: "You agree to use the service only for lawful purposes and in accordance with these terms. You must not misuse the service or interfere with its functionality.",
    },
    {
      title: "Account Responsibility",
      content: "You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility.",
    },
    {
      title: "Privacy",
      content: (
        <>
          We value your privacy. Please review our <a href="/privacy" className="text-orange-500 underline">Privacy Policy</a> to understand how we handle your personal information.
        </>
      ),
    },
    {
      title: "Modifications",
      content: "We reserve the right to update or modify these terms at any time. Continued use of the service implies acceptance of any changes.",
    },
    {
      title: "Termination",
      content: "We may suspend or terminate your access to our services without notice if you violate these terms.",
    },
    {
      title: "Limitation of Liability",
      content: "To the maximum extent permitted by law, KrishTech Computers will not be liable for any indirect, incidental, or consequential damages arising from the use of our service.",
    },
    {
      title: "Governing Law",
      content: "These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of Indian courts.",
    },
    {
      title: "Contact Us",
      content: (
        <>
          If you have questions regarding these Terms & Conditions, please contact us at:
          <ul className="mt-2 list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li>📧 Email: info@krishub.in</li>
            <li>📞 Phone: +91 98765 43210</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D0E12] text-gray-900 dark:text-[#E0E2EC] flex flex-col mt-12 transition-colors">
        {/* Header */}
        <header className="py-16 px-6 md:px-12 flex flex-col md:flex-row items-center bg-gradient-to-r from-orange-500 to-orange-400 rounded-b-3xl shadow-lg">
          <div className="w-4 h-32 bg-white/30 rounded mr-6 hidden md:block"></div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Terms & <span className="text-white/90">Conditions</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
              Read the rules and guidelines for using reNote responsibly.
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="flex flex-col px-4 md:px-12 gap-4 md:gap-6 pb-12 max-w-4xl mx-auto mt-12">
          {sections.map((section, idx) => (
            <section
              key={idx}
              className="relative bg-white dark:bg-[#16181E] border border-gray-100 dark:border-white/[0.08] p-4 md:p-8 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Numbered circle */}
              <div className="
                w-8 h-8 md:w-12 md:h-12 
                bg-orange-500 text-white font-bold rounded-full 
                flex items-center justify-center text-sm md:text-lg
                mb-2
                md:absolute md:-left-6 md:top-8
              ">
                {idx + 1}
              </div>

              <h2 className="text-xl md:text-2xl font-semibold text-orange-500 md:pl-16">
                {section.title}
              </h2>
              <div className="text-gray-700 dark:text-gray-300 text-sm md:text-base md:pl-16">
                {section.content}
              </div>
            </section>
          ))}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-[#16181E] text-gray-800 dark:text-gray-300 border-t border-gray-200 dark:border-white/[0.08] text-center py-6 mt-auto shadow-inner">
          <p>© {new Date().getFullYear()} reNote. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
