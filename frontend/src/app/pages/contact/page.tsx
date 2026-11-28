"use client";
import { useState } from "react";
import { safeToastSuccess } from "@utilis/toastHelper";
import { PrimaryBtn } from "@components/Button/index";
import apiClient from "@utilis/apiClient";
import Header from "@components/header/page";
import { API_ENDPOINTS } from "@constants/api";

export default function ContactUsPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<null | string>(null);

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const res = await apiClient.post(API_ENDPOINTS.CONTACT.SEND_MESSAGE,
                form, 
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.status >= 200 && res.status < 300) {
                safeToastSuccess("Message sent successfully!");
                setForm({ name: "", email: "", subject: "", message: "" }); // reset form
            } else {
                setStatus(`Failed: ${res.data?.message || "Something went wrong"}`);
            }
        } catch (err: any) {
            setStatus(
                err.response?.data?.message || "Network error. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-[#0D0E12] text-gray-800 dark:text-[#E0E2EC] flex flex-col p-2 transition-colors">
                {/* Hero / Header */}
                <header className="py-12 px-6 md:px-12 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        Contact <span className="text-orange-500">KrishTech Computers</span>
                    </h1>
                    <p className="mt-3 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto md:mx-0">
                        We’d love to hear from you. Reach out for inquiries, collaborations, or support.
                    </p>
                </header>

                {/* Main Content */}
                <main className="flex flex-col md:flex-row px-6 md:px-12 gap-8 md:gap-12 pb-12">
                    {/* Contact Form */}
                    <div className="md:w-1/2 w-full bg-white/80 dark:bg-[#16181E] text-gray-800 dark:text-gray-100 p-6 md:p-10 
    rounded-2xl shadow-lg border border-gray-200 dark:border-white/[0.08] border-t-4 border-t-orange-500 flex flex-col gap-6 transition hover:shadow-xl hover:scale-[1.01]">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Send Us a Message</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                            Fill out the form below and we’ll get back to you as soon as possible.
                        </p>

                        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1B1E26] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 shadow-sm focus:outline-none 
            focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition"
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1B1E26] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 shadow-sm focus:outline-none 
            focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition"
                            />
                            <input
                                type="text"
                                name="subject"
                                placeholder="Subject"
                                value={form.subject}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1B1E26] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 shadow-sm focus:outline-none 
            focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition"
                            />
                            <textarea
                                name="message"
                                placeholder="Message"
                                value={form.message}
                                onChange={handleChange}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = "auto";
                                    target.style.height = `${target.scrollHeight}px`;
                                }}
                                required
                                className="w-full border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1B1E26] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 shadow-sm focus:outline-none 
            focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition resize-none"
                            />

                            <PrimaryBtn
                                type="submit"
                                label={loading ? "Sending..." : "Send Message"}
                                disabled={loading}
                                className="mt-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white 
            font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition disabled:opacity-50"
                            />
                        </form>

                        {status && <p className="mt-2 text-sm">{status}</p>}
                    </div>


                    {/* Contact Info + Image */}
                    <div className="md:w-1/2 w-full flex flex-col items-center md:items-start gap-6">
                        <img
                            src="/KrishTech.png"
                            alt="Contact Illustration"
                            className="w-2/3 md:w-1/2 max-w-xs md:max-w-[220px] rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300"
                        />
                        <div className="flex flex-col gap-4 text-center md:text-left bg-white/70 dark:bg-[#16181E] border border-gray-200 dark:border-white/[0.08] backdrop-blur-md 
    p-6 rounded-2xl shadow-md border-l-4 border-l-orange-500 w-full transition hover:shadow-lg hover:scale-[1.01]">

                            <div>
                                <p className="text-gray-800 dark:text-white font-semibold flex items-center gap-2">📍 Address:</p>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    55, Venkatasamy Road West, opposite Krishna Plywood, R.S. Puram, Coimbatore, Tamil Nadu - 641002
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-800 dark:text-white font-semibold flex items-center gap-2">📧 Email:</p>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">info@krishub.in</p>
                            </div>
                            <div>
                                <p className="text-gray-800 dark:text-white font-semibold flex items-center gap-2">📞 Phone:</p>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">909 202 4444</p>
                            </div>
                        </div>


                        {/* Google Map */}
                        <div className="w-full mt-6 rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-white/[0.08]">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d39874.5894106426!2d76.9181239572829!3d11.031084949731502!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1756610349139!5m2!1sen!2sin"
                                width="600"
                                height="450"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white dark:bg-[#16181E] border-t border-gray-200 dark:border-white/[0.08] text-gray-800 dark:text-gray-300 text-center py-6 mt-auto shadow-inner">
                    <p>© {new Date().getFullYear()} KrishTech Computers. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}
