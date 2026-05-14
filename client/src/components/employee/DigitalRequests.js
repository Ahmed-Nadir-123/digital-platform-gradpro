/**
 * DigitalRequests.js — wrapper component
 * Organises all 7 service-request forms into two groups:
 *   Multi-Level  → Purchase | Transport | Food | Fund
 *   Single-Level → Software Install | Printing | Risk Report
 */
import React, { useState } from "react";
import MultiLevelRequests from "./MultiLevelRequests";
import SingleLevelRequests from "./SingleLevelRequests";
import { useLanguage } from "../../lib/LanguageContext";
import { getTranslation } from "./DigitalRequests.translations";
import { Layers, Zap } from "lucide-react";
import { useSelector } from "react-redux";

const DigitalRequests = () => {
  const { lang } = useLanguage();
  const t = (key) => getTranslation(lang, key);
  const isRTL = lang === "ar";
  const user = useSelector((state) => state.users.user);
  const isHod = Array.isArray(user?.roles) && (user.roles.includes("hod") || user.roles.includes("head_academic"));

  const [group, setGroup] = useState("multi");

  const segments = [
    {
      id: "multi",
      label: lang === "ar" ? "الموافقة المتعددة" : "Multi-Level Approval",
      desc:
        lang === "ar"
          ? isHod ? "شراء · مواصلات · وجبات · تمويل" : "شراء · مواصلات · وجبات"
          : isHod ? "Purchase · Transport · Food · Fund" : "Purchase · Transport · Food",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: "single",
      label: lang === "ar" ? "التعيين المباشر" : "Direct Assignment",
      desc:
        lang === "ar"
          ? "برامج · طباعة · مخاطر"
          : "Software · Printing · Risk",
      icon: <Zap className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Page header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Group selector */}
      <div className="flex gap-3">
        {segments.map((seg) => (
          <button
            key={seg.id}
            type="button"
            onClick={() => setGroup(seg.id)}
            className={`flex-1 flex flex-col items-start gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-colors
              ${
                group === seg.id
                  ? "border-foreground bg-foreground/5"
                  : "border-border bg-card hover:border-muted-foreground/40"
              }`}
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
              {seg.icon}
              {seg.label}
            </span>
            <span className="text-xs text-muted-foreground">{seg.desc}</span>
          </button>
        ))}
      </div>

      {/* Active form group */}
      {group === "multi" ? <MultiLevelRequests /> : <SingleLevelRequests />}
    </div>
  );
};

export default DigitalRequests;
