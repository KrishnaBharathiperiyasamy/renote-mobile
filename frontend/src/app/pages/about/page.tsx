'use client';

import React from 'react';
import { SecondaryBtn } from '@components/Button';
import Header from '@components/header/page';

export default function AboutUsPage() {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-[#0D0E12] text-gray-900 dark:text-[#E0E2EC] flex flex-col transition-colors">
                {/* Hero Section */}
                <section className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white py-10 px-6 md:px-12 rounded-2xl shadow-xl overflow-hidden m-4">
                    {/* Decorative Pulsing Circles */}
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        {/* Left Text Content */}
                        <div className="md:w-1/2 flex flex-col gap-4 text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-extrabold leading-snug">
                                About <span className="text-white/90">KrishTech Computers</span>
                            </h1>
                            <p className="text-base md:text-lg text-white/90 max-w-lg mx-auto md:mx-0">
                                Delivering software solutions, education, workspace rentals, and IT services since 2008.
                                We simplify business operations with innovative solutions for growth.
                            </p>
                            <SecondaryBtn
                                type="button"
                                label="Contact Us"
                                className="mt-2 py-2 px-5 text-sm md:text-base w-max bg-white text-orange-500 font-bold rounded-xl shadow-md hover:scale-95 transition-transform mx-auto md:mx-0"
                                onClick={() => window.location.href = '/pages/contact'}
                            />
                        </div>

                        {/* Right Illustration */}
                        <div className="md:w-1/2 w-full flex justify-center">
                            <img
                                src="/KrishTech.png"
                                alt="About KrishTech Illustration"
                                className="w-1/2 sm:w-2/3 md:w-1/2 md:max-w-[280px] h-auto rounded-xl shadow-lg hover:scale-105 transition-transform duration-300 ring-4 ring-white/20"
                            />
                        </div>
                    </div>
                </section>

                {/* Our Story Section */}
                <section className="bg-white dark:bg-[#16181E] py-20 px-6 md:px-20 flex flex-col md:flex-row gap-16 items-start border-t border-b border-gray-100 dark:border-white/[0.08]">
                    <div className="md:w-1/2 flex flex-col gap-6">
                        <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">Who We Are</h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            KrishTech Computers was founded in 2008. We provide education center solutions, software development, IT sales and services, and workspace rentals. Our goal is to simplify essential business tasks including accounting and provide complete software solutions for all business needs.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Our shared office setup allows freelancers and remote teams to access fully equipped workspaces without the high costs of traditional offices. Services include fully furnished desks, 24/7 high-speed Wi-Fi/Ethernet, cloud storage, and auto-power backup.
                        </p>
                    </div>

                    <div className="md:w-1/2 flex flex-col gap-6">
                        <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">Our Approach</h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            KrishTech delivers flexible, scalable, and easy-to-use solutions, reducing costs and enabling quick implementation. Our focus on customer satisfaction spans Sales, Service, Marketing, and Software Development units. Currently, we have over thirty skilled employees driving our growth.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            We foster an inclusive, balanced, and collaborative work environment where employees can develop talents, contribute to the community, and advance their careers.
                        </p>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-orange-500 py-20 px-6 md:px-20 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to grow your business with KrishTech?
                    </h2>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto mb-6">
                        Let us provide the tools, services, and workspace you need to thrive. Get in touch with our team today.
                    </p>
                    <SecondaryBtn
                        type="button"
                        label="Contact Us"
                        className="mt-2 py-2 text-sm w-max bg-white text-orange-500 font-bold transition-none"
                        onClick={() => window.location.href = '/pages/contact'}
                    />
                </section>
            </div>
        </>

    );
}
