
'use client';
// Hardcoded Free Plans for both billing cycles
const FREE_PLAN_MONTHLY: Plan = {
    _id: 'free-plan-monthly',
    name: 'Free',
    price: 0,
    duration: 'monthly',
    isActive: true,
    slug: 'free',
    features: {
        unlimitedInvoices: true,
        unlimitedEstimations: true,
        unlimitedProducts: true,
        maxFromCompanies: 1,
        unlimitedToCompanies: true,
        unlimitedPosters: false,
        maxPostersPerMonth: 5,
        unlimitedPosterLinks: false,
        maxPosterLinks: 3,
        posterLinkExpiryDays: 7,
        unlimitedVideoUploads: false,
        maxVideoUploadsPerMonth: 1,
        maxVideoStorageMB: 75,
        posterFrames: 50,
        supportLevel: 'none',
    },
};

const FREE_PLAN_ANNUALLY: Plan = {
    ...FREE_PLAN_MONTHLY,
    _id: 'free-plan-annually',
    duration: 'annually',
};

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Header from '@components/header/page';
import { useUser } from '@context/UserContext';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, ChevronUp, Infinity } from 'lucide-react';
import { isAxiosError } from 'axios';
import apiClient from '@utilis/apiClient';
import { API_ENDPOINTS } from '@constants/api';


// API Plan types
interface PlanFeatures {
    maxFromCompanies: number;
    maxPostersPerMonth: number;
    maxPosterLinks: number;
    posterLinkExpiryDays: number;
    maxVideoUploadsPerMonth: number;
    maxVideoStorageMB: number;
    posterFrames: number;
    supportLevel: string;
    unlimitedInvoices: boolean;
    unlimitedEstimations: boolean;
    unlimitedProducts: boolean;
    unlimitedToCompanies: boolean;
    unlimitedPosters: boolean;
    unlimitedPosterLinks: boolean;
    unlimitedVideoUploads: boolean;
}

interface ApiPlan {
    _id: string;
    name: string;
    price: number;
    duration: 'monthly' | 'annually';
    isActive: boolean;
    features: PlanFeatures;
}

// UI Plan type for rendering
interface Plan {
    _id: string;
    name: string;
    price: number;
    duration: 'monthly' | 'annually';
    isActive: boolean;
    features: PlanFeatures;
    slug: string;
    popular?: boolean;
}

// Helper to convert API plan to UI plan
const toPlanSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '');


const FAQ = [
    {
        q: 'What happens when I hit my poster limit?',
        a: 'You\'ll be notified and won\'t be able to create new posters until the next billing cycle. Existing posters remain accessible.',
    },
    {
        q: 'Can I change plans later?',
        a: 'Yes! You can upgrade anytime. Cancel your current plan first, then subscribe to a new one.',
    },
    {
        q: 'What is a poster link?',
        a: 'A shareable link that lets anyone view your poster publicly. Each link has an expiry based on your plan.',
    },
    {
        q: 'Is there a free trial?',
        a: 'The Free plan is available forever with generous limits. No credit card required.',
    },
];

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => { open: () => void };
    }
}


export default function SubscriptionPage() {
    const { profileImageUrl, fullName, isLoggedIn } = useUser();
    const router = useRouter();
    const [billing, setBilling] = useState<'monthly' | 'annually'>('monthly');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState<string | null>(null); // slug being purchased
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [fetching, setFetching] = useState(false);

    // Track user's current plan
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    // Fetch plans and current subscription
    useEffect(() => {
        setFetching(true);
        const token = localStorage.getItem('token');
        Promise.all([
            apiClient.get(API_ENDPOINTS.PLANS.GET_PLANS),
            apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.HISTORY, { headers: { Authorization: `Bearer ${token}` } })
        ])
            .then(([plansRes, historyRes]) => {
                console.log('Subscription history response:', historyRes.data);
                const apiPlans: ApiPlan[] = plansRes.data.plans || [];
                let mapped: Plan[] = apiPlans.map((p) => ({
                    ...p,
                    slug: toPlanSlug(p.name),
                    popular: toPlanSlug(p.name) === 'pro',
                }));
                // Inject Free plans for both billing cycles if not present
                const hasFreeMonthly = mapped.some((p) => p.slug === 'free' && p.duration === 'monthly');
                const hasFreeAnnually = mapped.some((p) => p.slug === 'free' && p.duration === 'annually');
                if (!hasFreeMonthly) mapped = [FREE_PLAN_MONTHLY, ...mapped];
                if (!hasFreeAnnually) mapped = [FREE_PLAN_ANNUALLY, ...mapped];
                setPlans(mapped);
                // Set current plan from history
                const cp = historyRes.data.currentPlan;
                let current = cp && cp.planId ? cp.planId : null;
                // If no current plan, set to Free plan for current billing
                if (!current) {
                    current = billing === 'annually' ? FREE_PLAN_ANNUALLY : FREE_PLAN_MONTHLY;
                }
                setCurrentPlan(current);
                // Select current plan if exists, else pro or first
                let sel = null;
                if (cp && cp.planId) sel = mapped.find((p) => p._id === (cp.planId._id || cp.planId));
                if (!sel) sel = mapped.find((p) => p.slug === 'pro') || mapped[0] || null;
                setSelectedPlan(sel);
            })
            .catch(() => setPlans([FREE_PLAN_MONTHLY, FREE_PLAN_ANNUALLY]))
            .finally(() => setFetching(false));
    }, []);

    const getPrice = (plan: Plan) => plan.price;
    const getMonthlyEquivalent = (plan: Plan) => {
        if (plan.duration === 'annually') return Math.round(plan.price / 12);
        return plan.price;
    };

    /* ─── Razorpay Checkout ─── */
    const loadRazorpayScript = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }, []);
    const handleBuyNow = async (plan: Plan) => {
        if (plan.slug === 'free') return;
        if (!isLoggedIn) {
            router.push('/pages/login');
            return;
        }
        setLoading(plan.slug);
        try {
            const token = localStorage.getItem('token');
            const { data } = await apiClient.post(
                API_ENDPOINTS.SUBSCRIPTIONS.CREATE_SUBSCRIPTION,
                { planId: plan._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Subscription created successfully!');
            // Immediately update currentPlan and selectedPlan so Cancel Subscription button appears without refresh
            setCurrentPlan(plan);
            setSelectedPlan(plan);
        } catch (err: unknown) {
            const msg = isAxiosError(err) ? err.response?.data?.message : 'Something went wrong';
            toast.error(msg || 'Failed to create subscription');
        } finally {
            setLoading(null);
        }
    };
    // const handleBuyNow = async (plan: Plan) => {
    //     if (plan.slug === 'free') return;
    //     if (!isLoggedIn) {
    //         router.push('/pages/login');
    //         return;
    //     }
    //     setLoading(plan.slug);
    //     try {
    //         const token = localStorage.getItem('token');
    //         // 1. Create Razorpay subscription session
    //         const { data } = await apiClient.post(
    //             API_ENDPOINTS.RAZORPAY.CREATE_SESSION,
    //             { planId: plan._id },
    //             { headers: { Authorization: `Bearer ${token}` } }
    //         );
    //         const { subscription } = data;
    //         await loadRazorpayScript();
    //         // 2. Open Razorpay Checkout
    //         const options = {
    //             key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Expose this in your .env
    //             subscription_id: subscription.id,
    //             name: 'Renote',
    //             description: `${plan.name} Plan Subscription`,
    //             image: '/reNote logo.png', // Updated logo for regular appearance
    //             handler: async function (response: any) {
    //                 // 3. On payment success, verify payment
    //                 try {
    //                     await apiClient.post(
    //                         API_ENDPOINTS.RAZORPAY.VERIFY_PAYMENT,
    //                         {
    //                             planId: plan._id,
    //                             razorpay_payment_id: response.razorpay_payment_id,
    //                             razorpay_subscription_id: response.razorpay_subscription_id,
    //                             razorpay_signature: response.razorpay_signature,
    //                         },
    //                         { headers: { Authorization: `Bearer ${token}` } }
    //                     );
    //                     toast.success('Subscription activated!');
    //                     setCurrentPlan(plan);
    //                     setSelectedPlan(plan);
    //                 } catch (err) {
    //                     toast.error('Payment verification failed');
    //                 } finally {
    //                     setLoading(null);
    //                 }
    //             },
    //             theme: { color: '#f97316' },
    //         };
    //         // @ts-ignore
    //         const rzp = new window.Razorpay(options);
    //         rzp.open();
    //     } catch (err: unknown) {
    //         const msg = isAxiosError(err) ? err.response?.data?.message : 'Something went wrong';
    //         toast.error(msg || 'Failed to initiate payment');
    //         setLoading(null);
    //     }
    // };

    /* ─── Render Helpers ─── */
    // Cancel subscription handler
    const handleCancelSubscription = async () => {
        setLoading(currentPlan ? currentPlan.slug : null);
        try {
            const token = localStorage.getItem('token');
            await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CANCEL, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Subscription cancelled successfully!');
            setCurrentPlan(null);
            setSelectedPlan(plans.find((p) => p.slug === 'free') || null);
        } catch (err: unknown) {
            const msg = isAxiosError(err) ? err.response?.data?.message : 'Something went wrong';
            toast.error(msg || 'Failed to cancel subscription');
        } finally {
            setLoading(null);
        }
    };

    const renderPlanButton = (plan: Plan, isMobile = false) => {
        const isCurrent = currentPlan && plan._id === (currentPlan._id || currentPlan);
        const isCurrentFree = currentPlan && (currentPlan.slug === 'free' || currentPlan.name?.toLowerCase() === 'free');
        if (isCurrent && plan.slug !== 'free') {
            return (
                <button
                    onClick={handleCancelSubscription}
                    disabled={loading === plan.slug}
                    className={`${isMobile ? 'w-full' : 'mt-8 w-full'} py-3 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition ${loading === plan.slug ? 'opacity-60 cursor-wait' : ''}`}
                >
                    {loading === plan.slug ? 'Processing...' : 'Cancel Subscription'}
                </button>
            );
        }
        if (plan.slug === 'free') {
            return (
                <button
                    disabled
                    className={`${isMobile ? 'w-full' : 'mt-8 w-full'} py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-[#1B1E26] text-gray-500 dark:text-gray-400 border border-transparent dark:border-white/[0.08] cursor-default`}
                >
                    Current Plan
                </button>
            );
        }
        // Enable Buy Now for all plans if current plan is free, otherwise disable
        const disableBuy = !!currentPlan && !isCurrentFree;
        return (
            <button
                onClick={() => handleBuyNow(plan)}
                disabled={disableBuy || loading === plan.slug}
                className={`${isMobile ? 'w-full' : 'mt-8 w-full'} py-3 rounded-xl text-sm font-semibold transition
                    ${plan.popular
                        ? 'bg-orange-500 text-white hover:brightness-110 shadow-lg'
                        : 'bg-orange-500 text-white hover:brightness-110'
                    } ${disableBuy || loading === plan.slug ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
                {loading === plan.slug ? 'Processing...' : `Buy Now — ₹${getPrice(plan).toLocaleString('en-IN')}`}
            </button>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0D0E12] text-gray-900 dark:text-[#E0E2EC] transition-colors">
            <Header />

            {/* ════════════ MOBILE ════════════ */}
            <section className="md:hidden w-full px-4 pt-14 pb-28 bg-gray-50 dark:bg-[#0D0E12]">
                {/* User Card */}
                <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                    <div className="flex justify-center relative z-10">
                        <div className="w-20 h-20 bg-white rounded-full overflow-hidden shadow-md flex items-center justify-center ring-4 ring-orange-200">
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt={fullName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-orange-500">👨‍💻</span>
                            )}
                        </div>
                    </div>
                    <h3 className="text-center text-xl font-bold mt-3 z-10 relative">{fullName || 'Guest'}</h3>
                    <p className="text-center text-sm mt-1 opacity-90 z-10 relative">Choose the right plan for you</p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mt-6 items-center gap-3">
                    <span className={`text-sm transition-colors ${billing === 'monthly' ? 'font-bold text-orange-500' : 'text-gray-400'}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBilling(billing === 'monthly' ? 'annually' : 'monthly')}
                        className={`w-16 h-7 rounded-full relative transition-colors duration-300 ${billing === 'annually' ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-md transition-transform duration-300 ${billing === 'annually' ? 'translate-x-9' : ''}`} />
                    </button>
                    <span className={`text-sm transition-colors ${billing === 'annually' ? 'font-bold text-orange-500' : 'text-gray-400'}`}>
                        Annually
                        <span className="ml-1 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">~17% off</span>
                    </span>
                </div>

                {/* Plan Cards */}
                <div className="mt-6 flex flex-col gap-4">
                    {fetching ? (
                        <div className="text-center py-10 text-gray-400">Loading plans...</div>
                    ) : plans.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">No plans available</div>
                    ) : plans
                        .filter((plan) => plan.duration === billing)
                        .map((plan) => {
                            const isSelected = selectedPlan?._id === plan._id;
                            const isFree = plan.slug === 'free';
                            return (
                                <div
                                    key={plan._id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`rounded-2xl p-5 cursor-pointer transition-all shadow-md hover:shadow-xl transform hover:-translate-y-1
                                                    ${isSelected
                                            ? 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30 border-2 border-orange-400 ring-1 ring-orange-200 dark:ring-orange-500/20'
                                            : isFree ? 'bg-gray-50 dark:bg-[#16181E] border border-gray-200 dark:border-white/[0.08]' : 'bg-white dark:bg-[#16181E] border border-gray-200 dark:border-white/[0.08]'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-white'}`}>{plan.name}</h4>
                                            {plan.popular && (
                                                <span className="text-[10px] font-semibold bg-orange-500 text-white px-2 py-0.5 rounded-full">Popular</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {isFree ? (
                                                <span className="text-lg font-extrabold text-gray-600 dark:text-gray-300">Free</span>
                                            ) : (
                                                <>
                                                    <span className="text-lg font-extrabold text-orange-500">₹{getPrice(plan).toLocaleString('en-IN')}</span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{billing === 'annually' ? 'per year' : 'per month'}</p>
                                                    {billing === 'annually' && (
                                                        <p className="text-[10px] text-gray-400 line-through">₹{(plan.price * 1).toLocaleString('en-IN')}/yr</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ul className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                        {/* Render features from plan.features */}
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>{plan.features.unlimitedInvoices ? 'Unlimited invoices' : `Invoices: Limited`}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>{plan.features.unlimitedEstimations ? 'Unlimited estimations' : `Estimations: Limited`}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>{plan.features.unlimitedProducts ? 'Unlimited products' : `Products: Limited`}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>From Companies: {plan.features.maxFromCompanies}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>To Companies: {plan.features.unlimitedToCompanies ? 'Unlimited' : 'Limited'}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>Posters / month: {plan.features.unlimitedPosters ? 'Unlimited' : plan.features.maxPostersPerMonth}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>Poster Links: {plan.features.unlimitedPosterLinks ? 'Unlimited' : plan.features.maxPosterLinks}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>Link Expiry: {plan.features.posterLinkExpiryDays} days</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>Video Uploads / month: {plan.features.unlimitedVideoUploads ? 'Unlimited' : plan.features.maxVideoUploadsPerMonth}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>Total Video Storage: {plan.features.maxVideoStorageMB} MB</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>Poster Frames: All {plan.features.posterFrames}</li>
                                        <li className="flex items-center gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center"><Check size={12} /></span>Support: {plan.features.supportLevel === 'none' ? '—' : plan.features.supportLevel.charAt(0).toUpperCase() + plan.features.supportLevel.slice(1)}</li>
                                    </ul>
                                    {isSelected && !isFree && (
                                        <div className="mt-3">{renderPlanButton(plan, true)}</div>
                                    )}
                                    {isSelected && isFree && (
                                        <span className="mt-2 inline-block text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1B1E26] px-3 py-1 rounded-full">Current Plan</span>
                                    )}
                                </div>
                            );
                        })}
                </div>

                {/* FAQ */}
                <div className="mt-10">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-2">
                        {FAQ.map((faq, i) => (
                            <div key={i} className="bg-white dark:bg-[#16181E] rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full text-left p-4 flex justify-between items-center"
                                >
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp size={18} className="text-gray-400 stroke-[2]" /> : <ChevronDown size={18} className="text-gray-400 stroke-[2]" />}
                                </button>
                                {openFaq === i && (
                                    <p className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">{faq.a}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mobile floating Buy Now for selected paid plan */}
            {selectedPlan && selectedPlan.slug !== 'free' && (
                <div className="fixed bottom-0 left-0 w-full md:hidden bg-white dark:bg-[#16181E] border-t border-gray-200 dark:border-white/[0.08] p-4 shadow-lg z-20">
                    <button
                        onClick={() => handleBuyNow(selectedPlan)}
                        disabled={!!loading}
                        className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 shadow-lg hover:scale-[0.98] active:scale-95 transition-transform ${loading ? 'opacity-60 cursor-wait' : ''}`}
                    >
                        {loading ? 'Processing...' : `Buy Now — ₹${getPrice(selectedPlan).toLocaleString('en-IN')}`}
                    </button>
                </div>
            )}

            {/* ════════════ DESKTOP ════════════ */}
            <main className="hidden md:block max-w-[1600px] mx-auto mt-4 pb-20 px-4 sm:px-6">
                {/* Heading */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Simple Pricing</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Choose a plan that scales with your creative needs</p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center items-center mb-12">
                    <div className="bg-gray-100 dark:bg-[#181B26] border border-transparent dark:border-[#282D3D] rounded-full p-1 flex">
                        {(['monthly', 'annually'] as const).map((option) => (
                            <button
                                key={option}
                                onClick={() => setBilling(option)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billing === option
                                    ? 'bg-orange-500 text-white shadow'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {option === 'annually' ? 'Annually' : 'Monthly'}
                                {option === 'annually' && (
                                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                        Save ~17%
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-4 gap-6 rounded-2xl shadow-2xl">
                    {fetching ? (
                        <div className="col-span-4 text-center py-10 text-gray-400">Loading plans...</div>
                    ) : plans.length === 0 ? (
                        <div className="col-span-4 text-center py-10 text-gray-400">No plans available</div>
                    ) : plans
                        .filter((plan) => plan.duration === billing)
                        .map((plan) => {
                            const isFree = plan.slug === 'free';
                            return (
                                <div
                                    key={plan._id}
                                    className={`flex flex-col justify-between rounded-2xl border p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-2 ${plan.popular
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 scale-105 shadow-lg'
                                        : isFree ? 'border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#16181E]' : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E]'
                                        }`}
                                >
                                    <div>
                                        {plan.popular && (
                                            <span className="inline-block text-xs font-semibold bg-orange-500 text-white px-3 py-1 rounded-full mb-4">Most Popular</span>
                                        )}
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h2>
                                        {isFree ? (
                                            <p className="mt-4 text-4xl font-extrabold text-gray-600 dark:text-gray-300">Free</p>
                                        ) : (
                                            <>
                                                <p className="mt-4 text-4xl font-extrabold text-orange-500">₹{getPrice(plan).toLocaleString('en-IN')}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{billing === 'annually' ? 'per year' : 'per month'}
                                                    {billing === 'annually' && (
                                                        <span className="ml-2 text-xs text-gray-400 line-through">₹{(plan.price * 1).toLocaleString('en-IN')}</span>
                                                    )}
                                                </p>
                                                {billing === 'annually' && (
                                                    <p className="text-xs text-green-600 font-medium mt-1">≈ ₹{getMonthlyEquivalent(plan)}/mo</p>
                                                )}
                                            </>
                                        )}
                                        <ul className="mt-8 space-y-3 text-gray-600 dark:text-gray-300">
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />{plan.features.unlimitedInvoices ? 'Unlimited invoices' : `Invoices: Limited`}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />{plan.features.unlimitedEstimations ? 'Unlimited estimations' : `Estimations: Limited`}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />{plan.features.unlimitedProducts ? 'Unlimited products' : `Products: Limited`}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />From Companies: {plan.features.maxFromCompanies}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />To Companies: {plan.features.unlimitedToCompanies ? 'Unlimited' : 'Limited'}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />Posters / month: {plan.features.unlimitedPosters ? 'Unlimited' : plan.features.maxPostersPerMonth}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />Poster Links: {plan.features.unlimitedPosterLinks ? 'Unlimited' : plan.features.maxPosterLinks}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />Link Expiry: {plan.features.posterLinkExpiryDays} days</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />Video Uploads / month: {plan.features.unlimitedVideoUploads ? 'Unlimited' : plan.features.maxVideoUploadsPerMonth}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />Total Video Storage: {plan.features.maxVideoStorageMB} MB</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />Poster Frames: All {plan.features.posterFrames}</li>
                                            <li className="flex items-start gap-2"><Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />Support: {plan.features.supportLevel === 'none' ? '—' : plan.features.supportLevel.charAt(0).toUpperCase() + plan.features.supportLevel.slice(1)}</li>
                                        </ul>
                                    </div>
                                    {renderPlanButton(plan)}
                                </div>
                            );
                        })}
                </div>

                {/* ─── Feature Comparison Table (Dynamic) ─── */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Feature Comparison</h2>
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] shadow-2xl transition-colors">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-200 dark:border-white/[0.08]">
                                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 w-1/5">Feature</th>
                                    {plans.filter(p => p.duration === billing).map((plan) => (
                                        <th key={plan._id} className={`text-center py-4 px-4 text-sm font-semibold ${plan.popular ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 rounded-t-xl' : 'text-gray-600 dark:text-gray-300'}`}>{plan.name}{plan.popular ? ' ★' : ''}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Feature rows */}
                                {[
                                    { label: 'Invoices', get: (f: PlanFeatures) => f.unlimitedInvoices ? 'Unlimited' : 'Limited' },
                                    { label: 'Estimations', get: (f: PlanFeatures) => f.unlimitedEstimations ? 'Unlimited' : 'Limited' },
                                    { label: 'Products', get: (f: PlanFeatures) => f.unlimitedProducts ? 'Unlimited' : 'Limited' },
                                    { label: 'From Companies', get: (f: PlanFeatures) => f.maxFromCompanies },
                                    { label: 'To Companies', get: (f: PlanFeatures) => f.unlimitedToCompanies ? 'Unlimited' : 'Limited' },
                                    { label: 'Posters / month', get: (f: PlanFeatures) => f.unlimitedPosters ? 'Unlimited' : f.maxPostersPerMonth },
                                    { label: 'Poster Links', get: (f: PlanFeatures) => f.unlimitedPosterLinks ? 'Unlimited' : f.maxPosterLinks },
                                    { label: 'Link Expiry', get: (f: PlanFeatures) => `${f.posterLinkExpiryDays} days` },
                                    { label: 'Video Uploads / month', get: (f: PlanFeatures) => f.unlimitedVideoUploads ? 'Unlimited' : f.maxVideoUploadsPerMonth },
                                    { label: 'Total Video Storage', get: (f: PlanFeatures) => `${f.maxVideoStorageMB} MB` },
                                    { label: 'Poster Frames', get: (f: PlanFeatures) => `All ${f.posterFrames}` },
                                    { label: 'Support', get: (f: PlanFeatures) => f.supportLevel === 'none' ? '—' : f.supportLevel.charAt(0).toUpperCase() + f.supportLevel.slice(1) },
                                ].map((row, i) => (
                                    <tr key={i} className={`border-b border-gray-100 dark:border-white/[0.06] ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.02]' : ''}`}>
                                        <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                                        {plans.filter(p => p.duration === billing).map((plan) => (
                                            <td key={plan._id} className={`py-3 px-4 text-sm text-center ${plan.popular ? 'text-orange-700 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                                                {row.get(plan.features) === 'Unlimited' ? <Infinity className="w-[18px] h-[18px] stroke-[2] mx-auto text-green-500" /> : row.get(plan.features)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── FAQ ─── */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {FAQ.map((faq, i) => (
                            <div key={i} className="bg-white dark:bg-[#16181E] rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full text-left p-5 flex justify-between items-center cursor-pointer"
                                >
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp size={18} className="text-gray-400 stroke-[2]" /> : <ChevronDown size={18} className="text-gray-400 stroke-[2]" />}
                                </button>
                                {openFaq === i && (
                                    <p className="px-5 pb-5 text-gray-500 dark:text-gray-400">{faq.a}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
