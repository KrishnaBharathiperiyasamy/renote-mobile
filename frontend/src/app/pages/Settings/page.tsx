"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // <-- Next.js hooks
import Header from "@components/header/page";
import CompanySettings from "@components/CompanySettings/page";
import AccountSettings from "@components/AccountSettings/page";
import SubscriptionSettings from "@components/SubscriptionSettings/page";
import { toast } from "react-toastify";

const tabs = [
  { name: "account", label: "Account Settings", shortLabel: "Account", component: AccountSettings },
  { name: "company", label: "Company Settings", shortLabel: "Company", component: CompanySettings },
  { name: "subscription", label: "Subscription", shortLabel: "Plan", component: SubscriptionSettings },
];

function New() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || tabs[0].name; // read ?tab=company
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    // Dismiss any active toast notifications when switching tabs
    toast.dismiss();
  }, [activeTab]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

  return (
    <div>
      <Header />
      {/* ════════════════ TABS TOOLBAR (MERGED DIRECTLY WITH HEADER) ════════════════ */}
      <div className="sticky top-16 z-30 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors border-b backdrop-blur-md bg-white/95 dark:bg-[#12141D]/95 border-gray-200 dark:border-[#222636] shadow-xs">
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-start flex-nowrap gap-2 sm:gap-4 overflow-x-auto overflow-y-hidden hide-scrollbar whitespace-nowrap py-1">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveTab(tab.name);
                  router.replace(`/pages/Settings?tab=${tab.name}`, { scroll: false });
                }}
                className={`relative shrink-0 px-4 sm:px-5 py-2 sm:py-2 text-sm sm:text-base font-medium rounded-full transition-all duration-300
                  ${
                    activeTab === tab.name
                      ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md scale-105"
                      : "text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-white/[0.06]"
                  }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Far-right action container on the same horizontal row as the tabs */}
          <div id="settings-tab-action" className="shrink-0 flex items-center justify-end" />
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-4 pb-12">
        {tabs.map((tab, index) => {
          if (tab.name === activeTab) {
            const Component = tab.component;
            return <Component key={index} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default New;
