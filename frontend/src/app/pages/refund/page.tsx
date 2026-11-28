"use client";
import Header from "@components/header/page";
import { RefreshCw } from "lucide-react";

export default function RefundPage() {
    return (
        <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-[#0D0E12] text-gray-900 dark:text-[#E0E2EC] transition-colors">
            <Header />
            <main className="flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center">
                {/* Header Banner */}
                <div className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white py-6 sm:py-8 shadow-md shrink-0">
                    <div className="max-w-3xl mx-auto px-6 flex items-center gap-3">
                        <RefreshCw size={32} className="animate-spin-slow shrink-0" />
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Refund Policy</h1>
                    </div>
                </div>

                {/* Content Card */}
                <div className="max-w-3xl w-full -mt-6 sm:-mt-8 px-4 sm:px-6 pb-6">
                    <div className="bg-white/80 dark:bg-[#16181E] backdrop-blur-lg shadow-xl rounded-2xl p-6 sm:p-7 md:p-8 border border-orange-100 dark:border-white/[0.08]">
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-5 leading-relaxed">
                            We want you to be <span className="font-semibold text-gray-900 dark:text-white">fully satisfied</span> with
                            your purchase. If you are not happy with your order, you may request
                            a refund in accordance with the terms below.
                        </p>

                        {/* Section */}
                        <div className="mb-4 sm:mb-5">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0" />
                                Eligibility for Refunds
                            </h2>
                            <ul className="list-disc list-inside text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1.5 leading-relaxed">
                                <li>Refund requests must be made within 7 days of purchase.</li>
                                <li>Only unused or unredeemed services/products are eligible.</li>
                                <li>Refunds will be processed back to the original payment method.</li>
                            </ul>
                        </div>

                        {/* Section */}
                        <div className="mb-4 sm:mb-5">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0" />
                                Processing Time
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                Refunds are typically processed within{" "}
                                <span className="font-semibold text-gray-900 dark:text-white">5–7 business days</span> after your
                                request has been approved.
                            </p>
                        </div>

                        {/* Section */}
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0" />
                                Contact Us
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                If you have any questions about our refund policy, please contact our
                                support team at{" "}
                                <a
                                    href="mailto:info@krishub.in"
                                    className="font-medium text-orange-600 dark:text-orange-400 hover:underline"
                                >
                                    info@krishub.in
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
