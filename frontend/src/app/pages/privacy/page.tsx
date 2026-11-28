import Header from "@components/header/page";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Introduction",
      content: (
        <>
          KrishTech Computers values your privacy and is committed to protecting your personal information. This policy outlines the types of data we collect and how it is used.
        </>
      ),
    },
    {
      title: "Data Collection",
      content: (
        <>
          We may collect the following types of information when you interact with our website:
          <ul className="mt-2 list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li>Personal information you provide through forms (name, email, phone, etc.)</li>
            <li>Technical data such as IP address, browser type, and pages visited</li>
            <li>Cookies and usage data to improve user experience</li>
          </ul>
        </>
      ),
    },
    {
      title: "Use of Information",
      content: (
        <>
          We use collected information to:
          <ul className="mt-2 list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li>Respond to inquiries and provide services</li>
            <li>Improve website functionality and user experience</li>
            <li>Send updates or marketing communications if you opted in</li>
          </ul>
        </>
      ),
    },
    {
      title: "Data Protection",
      content: "We implement appropriate security measures to protect your data from unauthorized access, alteration, or disclosure.",
    },
    {
      title: "Cookies",
      content: "Our website uses cookies to enhance your browsing experience. You can choose to disable cookies in your browser settings.",
    },
    {
      title: "Contact Us",
      content: (
        <>
          <Link
            href="/pages/contact"
            className="text-orange-600 font-medium hover:underline"
          >
            Contact Page
          </Link>
          If you have any questions about this Privacy Policy or how we handle your data, please contact us at:
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D0E12] text-gray-800 dark:text-[#E0E2EC] flex flex-col mt-12 transition-colors">
        {/* Header */}
        <header className="py-16 px-6 md:px-12 text-center md:text-left bg-gradient-to-r from-orange-500 to-orange-400 rounded-b-3xl shadow-lg">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Privacy <span className="text-white/90">Policy</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto md:mx-0 leading-relaxed">
            Your privacy is important to us. This Privacy Policy explains how KrishTech Computers collects, uses, and protects your information.
          </p>
        </header>

        {/* Content */}
        <main className="flex flex-col px-6 md:px-12 gap-8 pb-12 max-w-4xl mx-auto mt-12">
          {sections.map((section, idx) => (
            <section
              key={idx}
              className="bg-white dark:bg-[#16181E] border border-gray-100 dark:border-white/[0.08] p-8 rounded-3xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-orange-500 mb-4 border-b-2 border-orange-100 dark:border-white/[0.08] pb-2">
                {section.title}
              </h2>
              <div className="text-gray-700 dark:text-gray-300 mb-3">{section.content}</div>
            </section>
          ))}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-[#16181E] text-gray-800 dark:text-gray-300 border-t border-gray-200 dark:border-white/[0.08] text-center py-6 mt-auto shadow-inner">
          <p>© {new Date().getFullYear()} KrishTech Computers. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
