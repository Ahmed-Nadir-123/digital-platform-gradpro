/**
 * MultiLevelRequests.js
 * Forms for requests that go through a multi-level approval workflow:
 *  - Purchase Request
 *  - Transport Request
 *  - Food / Catering Request
 *  - Fund Request
 */
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createPurchaseRequest,
  createTransportRequest,
  createFoodRequest,
  createFundRequest,
} from "../../Features/DigitalRequestSlice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { useLanguage } from "../../lib/LanguageContext";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Car,
  UtensilsCrossed,
  Wallet,
  Send,
  Loader2,
} from "lucide-react";

/* ─── translations ─────────────────────────────────────────────────────────── */
const T = {
  en: {
    title: "Multi-Level Service Requests",
    subtitle: "Requests routed through the department approval chain",
    purchaseTab: "Purchase",
    transportTab: "Transport",
    foodTab: "Food / Catering",
    fundTab: "Fund Request",
    optional: "Optional",
    submitting: "Submitting…",
    priorityLabel: "Priority",
    priorityLow: "Low",
    priorityMedium: "Medium",
    priorityHigh: "High",
    notesLabel: "Additional Notes",
    notesPlaceholder: "Any special instructions or notes…",

    /* Purchase */
    purchaseTitle: "Purchase Request",
    itemDescLabel: "Item Description",
    itemDescPlaceholder: "e.g., Office chairs, Laptop stand, Projector…",
    quantityLabel: "Quantity",
    quantityPlaceholder: "e.g., 5",
    estimatedCostLabel: "Estimated Cost (OMR)",
    estimatedCostPlaceholder: "e.g., 150.000",
    justificationLabel: "Justification",
    justificationPlaceholder:
      "Why is this item required? Which department/staff will use it?",
    expectedDeliveryLabel: "Expected Delivery Date",
    submitPurchase: "Submit Purchase Request",

    /* Transport */
    transportTitle: "Transport Request",
    destinationLabel: "Destination",
    destinationPlaceholder: "e.g., Ministry of Education, Muscat",
    departureDateLabel: "Departure Date & Time",
    returnDateLabel: "Return Date & Time",
    passengersLabel: "Number of Passengers",
    passengersPlaceholder: "e.g., 3",
    vehicleTypeLabel: "Vehicle Type",
    vehicleSelect: "— Select vehicle type —",
    vehicleTypeCar: "Car",
    vehicleTypeBus: "Bus",
    vehicleTypeVan: "Van",
    vehicleTypeMinibus: "Minibus",
    vehicleTypeOther: "Other",
    tripPurposeLabel: "Purpose of Trip",
    tripPurposePlaceholder:
      "e.g., Conference attendance, Site visit, Field trip…",
    submitTransport: "Submit Transport Request",

    /* Food */
    foodTitle: "Food / Catering Request",
    eventNameLabel: "Event / Occasion Name",
    eventNamePlaceholder:
      "e.g., Staff Meeting, Workshop, Graduation Ceremony…",
    eventDateLabel: "Event Date",
    eventLocationLabel: "Venue / Location",
    eventLocationPlaceholder: "e.g., Conference Room B, Building A",
    attendeesLabel: "Number of Attendees",
    attendeesPlaceholder: "e.g., 20",
    mealTypeLabel: "Meal Type",
    mealSelect: "— Select meal type —",
    mealBreakfast: "Breakfast",
    mealLunch: "Lunch",
    mealDinner: "Dinner",
    mealSnacks: "Snacks",
    dietaryLabel: "Dietary Requirements",
    dietaryPlaceholder: "e.g., Vegetarian options, No nuts…",
    foodBudgetLabel: "Estimated Budget (OMR)",
    foodBudgetPlaceholder: "e.g., 200.000",
    cateringVendorLabel: "Preferred Catering Vendor",
    cateringVendorPlaceholder: "e.g., Al Bustan Catering",
    submitFood: "Submit Food Request",

    /* Fund */
    fundTitle: "Fund Request",
    fundNote: "This request is restricted to Head of Department (HOD) role.",
    fundPurposeLabel: "Purpose / Title",
    fundPurposePlaceholder:
      "e.g., Training budget, Equipment maintenance fund…",
    requestedAmountLabel: "Requested Amount",
    requestedAmountPlaceholder: "e.g., 500.000",
    currencyLabel: "Currency",
    justifyFundLabel: "Justification",
    justifyFundPlaceholder:
      "Provide detailed justification for this fund request…",
    budgetCodeLabel: "Budget Code",
    budgetCodePlaceholder: "e.g., IT-2025-001",
    paymentMethodLabel: "Payment Method",
    paymentSelect: "— Select payment method —",
    paymentCash: "Cash",
    paymentBankTransfer: "Bank Transfer",
    paymentCheque: "Cheque",
    beneficiaryNameLabel: "Beneficiary Name",
    beneficiaryNamePlaceholder: "Full name of the beneficiary…",
    beneficiaryAccountLabel: "Beneficiary Account / Reference",
    beneficiaryAccountPlaceholder: "Bank account number or reference…",
    disbursementDateLabel: "Expected Disbursement Date",
    submitFund: "Submit Fund Request",

    /* Errors */
    errPurchase: "Please fill in all required purchase fields.",
    errTransport: "Please fill in all required transport fields.",
    errFood: "Please fill in all required food request fields.",
    errFund: "Please fill in all required fund request fields.",
    errGeneral: "Failed to submit. Please try again.",
    required: "*",
  },
  ar: {
    title: "طلبات الخدمة متعددة المستويات",
    subtitle: "طلبات تمر عبر سلسلة موافقات القسم",
    purchaseTab: "شراء",
    transportTab: "مواصلات",
    foodTab: "وجبات / ضيافة",
    fundTab: "طلب تمويل",
    optional: "اختياري",
    submitting: "جارٍ الإرسال…",
    priorityLabel: "الأولوية",
    priorityLow: "منخفض",
    priorityMedium: "متوسط",
    priorityHigh: "مرتفع",
    notesLabel: "ملاحظات إضافية",
    notesPlaceholder: "أي تعليمات أو ملاحظات خاصة…",

    /* Purchase */
    purchaseTitle: "طلب شراء",
    itemDescLabel: "وصف المادة",
    itemDescPlaceholder: "مثال: كراسي مكتبية، حامل لابتوب، جهاز عرض…",
    quantityLabel: "الكمية",
    quantityPlaceholder: "مثال: 5",
    estimatedCostLabel: "التكلفة التقديرية (ريال عماني)",
    estimatedCostPlaceholder: "مثال: 150.000",
    justificationLabel: "التبرير",
    justificationPlaceholder:
      "لماذا هذه المادة مطلوبة؟ لأي قسم/موظف ستُستخدم؟",
    expectedDeliveryLabel: "تاريخ التسليم المتوقع",
    submitPurchase: "إرسال طلب الشراء",

    /* Transport */
    transportTitle: "طلب مواصلات",
    destinationLabel: "الوجهة",
    destinationPlaceholder: "مثال: وزارة التربية والتعليم، مسقط",
    departureDateLabel: "تاريخ ووقت المغادرة",
    returnDateLabel: "تاريخ ووقت العودة",
    passengersLabel: "عدد الركاب",
    passengersPlaceholder: "مثال: 3",
    vehicleTypeLabel: "نوع المركبة",
    vehicleSelect: "— اختر نوع المركبة —",
    vehicleTypeCar: "سيارة",
    vehicleTypeBus: "حافلة",
    vehicleTypeVan: "فان",
    vehicleTypeMinibus: "ميني باص",
    vehicleTypeOther: "أخرى",
    tripPurposeLabel: "الغرض من الرحلة",
    tripPurposePlaceholder: "مثال: حضور مؤتمر، زيارة ميدانية، رحلة دراسية…",
    submitTransport: "إرسال طلب المواصلات",

    /* Food */
    foodTitle: "طلب وجبات / ضيافة",
    eventNameLabel: "اسم الفعالية / المناسبة",
    eventNamePlaceholder: "مثال: اجتماع الموظفين، ورشة عمل، حفل التخرج…",
    eventDateLabel: "تاريخ الفعالية",
    eventLocationLabel: "المكان / القاعة",
    eventLocationPlaceholder: "مثال: قاعة المؤتمرات ب، المبنى أ",
    attendeesLabel: "عدد الحاضرين",
    attendeesPlaceholder: "مثال: 20",
    mealTypeLabel: "نوع الوجبة",
    mealSelect: "— اختر نوع الوجبة —",
    mealBreakfast: "إفطار",
    mealLunch: "غداء",
    mealDinner: "عشاء",
    mealSnacks: "وجبات خفيفة",
    dietaryLabel: "متطلبات غذائية خاصة",
    dietaryPlaceholder: "مثال: خيارات نباتية، بدون مكسرات…",
    foodBudgetLabel: "الميزانية التقديرية (ريال عماني)",
    foodBudgetPlaceholder: "مثال: 200.000",
    cateringVendorLabel: "مزود الضيافة المفضل",
    cateringVendorPlaceholder: "مثال: شركة البستان للضيافة",
    submitFood: "إرسال طلب الوجبات",

    /* Fund */
    fundTitle: "طلب تمويل",
    fundNote: "هذا الطلب مقتصر على رئيس القسم (HOD).",
    fundPurposeLabel: "الغرض / العنوان",
    fundPurposePlaceholder: "مثال: ميزانية التدريب، صندوق صيانة المعدات…",
    requestedAmountLabel: "المبلغ المطلوب",
    requestedAmountPlaceholder: "مثال: 500.000",
    currencyLabel: "العملة",
    justifyFundLabel: "التبرير",
    justifyFundPlaceholder: "قدّم تبريراً تفصيلياً لهذا الطلب…",
    budgetCodeLabel: "كود الميزانية",
    budgetCodePlaceholder: "مثال: IT-2025-001",
    paymentMethodLabel: "طريقة الدفع",
    paymentSelect: "— اختر طريقة الدفع —",
    paymentCash: "نقداً",
    paymentBankTransfer: "تحويل بنكي",
    paymentCheque: "شيك",
    beneficiaryNameLabel: "اسم المستفيد",
    beneficiaryNamePlaceholder: "الاسم الكامل للمستفيد…",
    beneficiaryAccountLabel: "حساب / مرجع المستفيد",
    beneficiaryAccountPlaceholder: "رقم الحساب البنكي أو المرجع…",
    disbursementDateLabel: "تاريخ الصرف المتوقع",
    submitFund: "إرسال طلب التمويل",

    /* Errors */
    errPurchase: "يرجى ملء جميع حقول الشراء المطلوبة.",
    errTransport: "يرجى ملء جميع حقول المواصلات المطلوبة.",
    errFood: "يرجى ملء جميع حقول طلب الوجبات المطلوبة.",
    errFund: "يرجى ملء جميع حقول طلب التمويل المطلوبة.",
    errGeneral: "فشل الإرسال. يرجى المحاولة مرة أخرى.",
    required: "*",
  },
};

/* ─── component ─────────────────────────────────────────────────────────────── */
const MultiLevelRequests = () => {
  const { lang } = useLanguage();
  const t = T[lang] || T.en;
  const isRTL = lang === "ar";

  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.digitalRequests);
  const user = useSelector((state) => state.users.user);

  const [activeTab, setActiveTab] = useState("purchase");

  /* ── Purchase state ── */
  const [purchase, setPurchase] = useState({
    itemDescription: "",
    quantity: "",
    estimatedCost: "",
    justification: "",
    urgency: "Medium",
    expectedDeliveryDate: "",
    additionalNotes: "",
  });

  /* ── Transport state ── */
  const [transport, setTransport] = useState({
    destination: "",
    departureDate: "",
    returnDate: "",
    numberOfPassengers: "",
    vehicleType: "",
    tripPurpose: "",
    additionalNotes: "",
  });

  /* ── Food state ── */
  const [food, setFood] = useState({
    eventName: "",
    eventDate: "",
    eventLocation: "",
    numberOfAttendees: "",
    mealType: "",
    dietaryRequirements: "",
    estimatedBudget: "",
    cateringVendor: "",
    additionalNotes: "",
  });

  /* ── Fund state ── */
  const [fund, setFund] = useState({
    fundPurpose: "",
    requestedAmount: "",
    currency: "OMR",
    justification: "",
    budgetCode: "",
    paymentMethod: "",
    beneficiaryName: "",
    beneficiaryAccount: "",
    disbursementDate: "",
  });

  /* ── Submit handlers ── */
  const onSubmitPurchase = async (e) => {
    e.preventDefault();
    const { itemDescription, quantity, estimatedCost, justification } = purchase;
    if (!itemDescription || !quantity || !estimatedCost || !justification) {
      toast.error(t.errPurchase);
      return;
    }
    try {
      const result = await dispatch(
        createPurchaseRequest({
          requesterId: user._id,
          itemDescription,
          quantity: Number(quantity),
          estimatedCost: Number(estimatedCost),
          justification,
          urgency: purchase.urgency,
          priority: purchase.urgency?.toLowerCase(),
          expectedDeliveryDate: purchase.expectedDeliveryDate || null,
          additionalNotes: purchase.additionalNotes,
        }),
      );
      if (result.type === "digitalRequests/createPurchase/fulfilled") {
        toast.success(`✓ Request submitted — ID: ${result.payload?.requestId || result.payload?.requestNumber}`);
        setPurchase({
          itemDescription: "",
          quantity: "",
          estimatedCost: "",
          justification: "",
          urgency: "Medium",
          expectedDeliveryDate: "",
          additionalNotes: "",
        });
      } else {
        toast.error(result.payload || t.errGeneral);
      }
    } catch {
      toast.error(t.errGeneral);
    }
  };

  const onSubmitTransport = async (e) => {
    e.preventDefault();
    const { destination, departureDate, numberOfPassengers, tripPurpose } = transport;
    if (!destination || !departureDate || !numberOfPassengers || !tripPurpose) {
      toast.error(t.errTransport);
      return;
    }
    try {
      const result = await dispatch(
        createTransportRequest({
          requesterId: user._id,
          destination,
          departureDate,
          returnDate: transport.returnDate || null,
          numberOfPassengers: Number(numberOfPassengers),
          vehicleType: transport.vehicleType,
          tripPurpose,
          additionalNotes: transport.additionalNotes,
        }),
      );
      if (result.type === "digitalRequests/createTransport/fulfilled") {
        toast.success(`✓ Request submitted — ID: ${result.payload?.requestId || result.payload?.requestNumber}`);
        setTransport({
          destination: "",
          departureDate: "",
          returnDate: "",
          numberOfPassengers: "",
          vehicleType: "",
          tripPurpose: "",
          additionalNotes: "",
        });
      } else {
        toast.error(result.payload || t.errGeneral);
      }
    } catch {
      toast.error(t.errGeneral);
    }
  };

  const onSubmitFood = async (e) => {
    e.preventDefault();
    const { eventName, eventDate, eventLocation, numberOfAttendees, mealType } = food;
    if (!eventName || !eventDate || !eventLocation || !numberOfAttendees || !mealType) {
      toast.error(t.errFood);
      return;
    }
    try {
      const result = await dispatch(
        createFoodRequest({
          requesterId: user._id,
          eventName,
          eventDate,
          eventLocation,
          numberOfAttendees: Number(numberOfAttendees),
          mealType,
          dietaryRequirements: food.dietaryRequirements,
          estimatedBudget: food.estimatedBudget ? Number(food.estimatedBudget) : undefined,
          cateringVendor: food.cateringVendor,
          additionalNotes: food.additionalNotes,
        }),
      );
      if (result.type === "digitalRequests/createFood/fulfilled") {
        toast.success(`✓ Request submitted — ID: ${result.payload?.requestId || result.payload?.requestNumber}`);
        setFood({
          eventName: "",
          eventDate: "",
          eventLocation: "",
          numberOfAttendees: "",
          mealType: "",
          dietaryRequirements: "",
          estimatedBudget: "",
          cateringVendor: "",
          additionalNotes: "",
        });
      } else {
        toast.error(result.payload || t.errGeneral);
      }
    } catch {
      toast.error(t.errGeneral);
    }
  };

  const onSubmitFund = async (e) => {
    e.preventDefault();
    const { fundPurpose, requestedAmount, currency, justification } = fund;
    if (!fundPurpose || !requestedAmount || !justification) {
      toast.error(t.errFund);
      return;
    }
    try {
      const result = await dispatch(
        createFundRequest({
          requesterId: user._id,
          fundPurpose,
          requestedAmount: Number(requestedAmount),
          currency,
          justification,
          budgetCode: fund.budgetCode,
          paymentMethod: fund.paymentMethod,
          beneficiaryName: fund.beneficiaryName,
          beneficiaryAccount: fund.beneficiaryAccount,
          disbursementDate: fund.disbursementDate || null,
        }),
      );
      if (result.type === "digitalRequests/createFund/fulfilled") {
        toast.success(`✓ Request submitted — ID: ${result.payload?.requestId || result.payload?.requestNumber}`);
        setFund({
          fundPurpose: "",
          requestedAmount: "",
          currency: "OMR",
          justification: "",
          budgetCode: "",
          paymentMethod: "",
          beneficiaryName: "",
          beneficiaryAccount: "",
          disbursementDate: "",
        });
      } else {
        toast.error(result.payload || t.errGeneral);
      }
    } catch {
      toast.error(t.errGeneral);
    }
  };

  /* ── Helpers ── */
  const req = <span className="text-destructive">{t.required}</span>;
  const optBadge = (
    <span className="text-xs text-muted-foreground ml-1">({t.optional})</span>
  );

  const isHod = Array.isArray(user?.roles) && (user.roles.includes("hod") || user.roles.includes("head_academic"));

  const tabs = [
    { id: "purchase", label: t.purchaseTab, icon: <ShoppingCart className="h-4 w-4" /> },
    { id: "transport", label: t.transportTab, icon: <Car className="h-4 w-4" /> },
    { id: "food", label: t.foodTab, icon: <UtensilsCrossed className="h-4 w-4" /> },
    ...(isHod ? [{ id: "fund", label: t.fundTab, icon: <Wallet className="h-4 w-4" /> }] : []),
  ];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
              ${
                activeTab === id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════ PURCHASE ══════════════════ */}
      {activeTab === "purchase" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            {t.purchaseTitle}
          </h3>
          <form onSubmit={onSubmitPurchase} className="space-y-4">
            {/* Item Description */}
            <div className="space-y-1.5">
              <Label>{t.itemDescLabel} {req}</Label>
              <Textarea
                rows={3}
                placeholder={t.itemDescPlaceholder}
                value={purchase.itemDescription}
                onChange={(e) =>
                  setPurchase({ ...purchase, itemDescription: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-1.5">
                <Label>{t.quantityLabel} {req}</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder={t.quantityPlaceholder}
                  value={purchase.quantity}
                  onChange={(e) =>
                    setPurchase({ ...purchase, quantity: e.target.value })
                  }
                  required
                />
              </div>
              {/* Estimated Cost */}
              <div className="space-y-1.5">
                <Label>{t.estimatedCostLabel} {req}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder={t.estimatedCostPlaceholder}
                  value={purchase.estimatedCost}
                  onChange={(e) =>
                    setPurchase({ ...purchase, estimatedCost: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Justification */}
            <div className="space-y-1.5">
              <Label>{t.justificationLabel} {req}</Label>
              <Textarea
                rows={4}
                placeholder={t.justificationPlaceholder}
                value={purchase.justification}
                onChange={(e) =>
                  setPurchase({ ...purchase, justification: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-1.5">
                <Label>{t.priorityLabel}</Label>
                <Select
                  value={purchase.urgency}
                  onChange={(e) =>
                    setPurchase({ ...purchase, urgency: e.target.value })
                  }>
                  <option value="Low">{t.priorityLow}</option>
                  <option value="Medium">{t.priorityMedium}</option>
                  <option value="High">{t.priorityHigh}</option>
                </Select>
              </div>
              {/* Expected Delivery */}
              <div className="space-y-1.5">
                <Label>{t.expectedDeliveryLabel} {optBadge}</Label>
                <Input
                  type="date"
                  value={purchase.expectedDeliveryDate}
                  onChange={(e) =>
                    setPurchase({ ...purchase, expectedDeliveryDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-1.5">
              <Label>{t.notesLabel} {optBadge}</Label>
              <Textarea
                rows={2}
                placeholder={t.notesPlaceholder}
                value={purchase.additionalNotes}
                onChange={(e) =>
                  setPurchase({ ...purchase, additionalNotes: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</>
              ) : (
                <><Send className="h-4 w-4" /> {t.submitPurchase}</>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* ══════════════════ TRANSPORT ══════════════════ */}
      {activeTab === "transport" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Car className="h-5 w-5 text-muted-foreground" />
            {t.transportTitle}
          </h3>
          <form onSubmit={onSubmitTransport} className="space-y-4">
            {/* Destination */}
            <div className="space-y-1.5">
              <Label>{t.destinationLabel} {req}</Label>
              <Input
                type="text"
                placeholder={t.destinationPlaceholder}
                value={transport.destination}
                onChange={(e) =>
                  setTransport({ ...transport, destination: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Departure Date */}
              <div className="space-y-1.5">
                <Label>{t.departureDateLabel} {req}</Label>
                <Input
                  type="datetime-local"
                  value={transport.departureDate}
                  onChange={(e) =>
                    setTransport({ ...transport, departureDate: e.target.value })
                  }
                  required
                />
              </div>
              {/* Return Date */}
              <div className="space-y-1.5">
                <Label>{t.returnDateLabel} {optBadge}</Label>
                <Input
                  type="datetime-local"
                  value={transport.returnDate}
                  onChange={(e) =>
                    setTransport({ ...transport, returnDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Passengers */}
              <div className="space-y-1.5">
                <Label>{t.passengersLabel} {req}</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder={t.passengersPlaceholder}
                  value={transport.numberOfPassengers}
                  onChange={(e) =>
                    setTransport({ ...transport, numberOfPassengers: e.target.value })
                  }
                  required
                />
              </div>
              {/* Vehicle Type */}
              <div className="space-y-1.5">
                <Label>{t.vehicleTypeLabel} {optBadge}</Label>
                <Select
                  value={transport.vehicleType}
                  onChange={(e) =>
                    setTransport({ ...transport, vehicleType: e.target.value })
                  }>
                  <option value="">{t.vehicleSelect}</option>
                  <option value="Car">{t.vehicleTypeCar}</option>
                  <option value="Bus">{t.vehicleTypeBus}</option>
                  <option value="Van">{t.vehicleTypeVan}</option>
                  <option value="Minibus">{t.vehicleTypeMinibus}</option>
                  <option value="Other">{t.vehicleTypeOther}</option>
                </Select>
              </div>
            </div>

            {/* Trip Purpose */}
            <div className="space-y-1.5">
              <Label>{t.tripPurposeLabel} {req}</Label>
              <Textarea
                rows={3}
                placeholder={t.tripPurposePlaceholder}
                value={transport.tripPurpose}
                onChange={(e) =>
                  setTransport({ ...transport, tripPurpose: e.target.value })
                }
                required
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-1.5">
              <Label>{t.notesLabel} {optBadge}</Label>
              <Textarea
                rows={2}
                placeholder={t.notesPlaceholder}
                value={transport.additionalNotes}
                onChange={(e) =>
                  setTransport({ ...transport, additionalNotes: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</>
              ) : (
                <><Send className="h-4 w-4" /> {t.submitTransport}</>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* ══════════════════ FOOD ══════════════════ */}
      {activeTab === "food" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            {t.foodTitle}
          </h3>
          <form onSubmit={onSubmitFood} className="space-y-4">
            {/* Event Name */}
            <div className="space-y-1.5">
              <Label>{t.eventNameLabel} {req}</Label>
              <Input
                type="text"
                placeholder={t.eventNamePlaceholder}
                value={food.eventName}
                onChange={(e) =>
                  setFood({ ...food, eventName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Event Date */}
              <div className="space-y-1.5">
                <Label>{t.eventDateLabel} {req}</Label>
                <Input
                  type="date"
                  value={food.eventDate}
                  onChange={(e) =>
                    setFood({ ...food, eventDate: e.target.value })
                  }
                  required
                />
              </div>
              {/* Number of Attendees */}
              <div className="space-y-1.5">
                <Label>{t.attendeesLabel} {req}</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder={t.attendeesPlaceholder}
                  value={food.numberOfAttendees}
                  onChange={(e) =>
                    setFood({ ...food, numberOfAttendees: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Event Location */}
            <div className="space-y-1.5">
              <Label>{t.eventLocationLabel} {req}</Label>
              <Input
                type="text"
                placeholder={t.eventLocationPlaceholder}
                value={food.eventLocation}
                onChange={(e) =>
                  setFood({ ...food, eventLocation: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Meal Type */}
              <div className="space-y-1.5">
                <Label>{t.mealTypeLabel} {req}</Label>
                <Select
                  value={food.mealType}
                  onChange={(e) =>
                    setFood({ ...food, mealType: e.target.value })
                  }
                  required>
                  <option value="">{t.mealSelect}</option>
                  <option value="Breakfast">{t.mealBreakfast}</option>
                  <option value="Lunch">{t.mealLunch}</option>
                  <option value="Dinner">{t.mealDinner}</option>
                  <option value="Snacks">{t.mealSnacks}</option>
                </Select>
              </div>
              {/* Estimated Budget */}
              <div className="space-y-1.5">
                <Label>{t.foodBudgetLabel} {optBadge}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder={t.foodBudgetPlaceholder}
                  value={food.estimatedBudget}
                  onChange={(e) =>
                    setFood({ ...food, estimatedBudget: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Dietary Requirements */}
            <div className="space-y-1.5">
              <Label>{t.dietaryLabel} {optBadge}</Label>
              <Input
                type="text"
                placeholder={t.dietaryPlaceholder}
                value={food.dietaryRequirements}
                onChange={(e) =>
                  setFood({ ...food, dietaryRequirements: e.target.value })
                }
              />
            </div>

            {/* Catering Vendor */}
            <div className="space-y-1.5">
              <Label>{t.cateringVendorLabel} {optBadge}</Label>
              <Input
                type="text"
                placeholder={t.cateringVendorPlaceholder}
                value={food.cateringVendor}
                onChange={(e) =>
                  setFood({ ...food, cateringVendor: e.target.value })
                }
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-1.5">
              <Label>{t.notesLabel} {optBadge}</Label>
              <Textarea
                rows={2}
                placeholder={t.notesPlaceholder}
                value={food.additionalNotes}
                onChange={(e) =>
                  setFood({ ...food, additionalNotes: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</>
              ) : (
                <><Send className="h-4 w-4" /> {t.submitFood}</>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* ══════════════════ FUND ══════════════════ */}
      {activeTab === "fund" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            {t.fundTitle}
          </h3>

          {/* HOD-only notice */}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {t.fundNote}
          </p>

          <form onSubmit={onSubmitFund} className="space-y-4">
            {/* Fund Purpose */}
            <div className="space-y-1.5">
              <Label>{t.fundPurposeLabel} {req}</Label>
              <Textarea
                rows={2}
                placeholder={t.fundPurposePlaceholder}
                value={fund.fundPurpose}
                onChange={(e) =>
                  setFund({ ...fund, fundPurpose: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Requested Amount */}
              <div className="space-y-1.5">
                <Label>{t.requestedAmountLabel} {req}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder={t.requestedAmountPlaceholder}
                  value={fund.requestedAmount}
                  onChange={(e) =>
                    setFund({ ...fund, requestedAmount: e.target.value })
                  }
                  required
                />
              </div>
              {/* Currency */}
              <div className="space-y-1.5">
                <Label>{t.currencyLabel} {req}</Label>
                <Select
                  value={fund.currency}
                  onChange={(e) =>
                    setFund({ ...fund, currency: e.target.value })
                  }>
                  <option value="OMR">OMR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </Select>
              </div>
            </div>

            {/* Justification */}
            <div className="space-y-1.5">
              <Label>{t.justifyFundLabel} {req}</Label>
              <Textarea
                rows={4}
                placeholder={t.justifyFundPlaceholder}
                value={fund.justification}
                onChange={(e) =>
                  setFund({ ...fund, justification: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Budget Code */}
              <div className="space-y-1.5">
                <Label>{t.budgetCodeLabel} {optBadge}</Label>
                <Input
                  type="text"
                  placeholder={t.budgetCodePlaceholder}
                  value={fund.budgetCode}
                  onChange={(e) =>
                    setFund({ ...fund, budgetCode: e.target.value })
                  }
                />
              </div>
              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label>{t.paymentMethodLabel} {optBadge}</Label>
                <Select
                  value={fund.paymentMethod}
                  onChange={(e) =>
                    setFund({ ...fund, paymentMethod: e.target.value })
                  }>
                  <option value="">{t.paymentSelect}</option>
                  <option value="Cash">{t.paymentCash}</option>
                  <option value="Bank Transfer">{t.paymentBankTransfer}</option>
                  <option value="Cheque">{t.paymentCheque}</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Beneficiary Name */}
              <div className="space-y-1.5">
                <Label>{t.beneficiaryNameLabel} {optBadge}</Label>
                <Input
                  type="text"
                  placeholder={t.beneficiaryNamePlaceholder}
                  value={fund.beneficiaryName}
                  onChange={(e) =>
                    setFund({ ...fund, beneficiaryName: e.target.value })
                  }
                />
              </div>
              {/* Beneficiary Account */}
              <div className="space-y-1.5">
                <Label>{t.beneficiaryAccountLabel} {optBadge}</Label>
                <Input
                  type="text"
                  placeholder={t.beneficiaryAccountPlaceholder}
                  value={fund.beneficiaryAccount}
                  onChange={(e) =>
                    setFund({ ...fund, beneficiaryAccount: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Disbursement Date */}
            <div className="space-y-1.5">
              <Label>{t.disbursementDateLabel} {optBadge}</Label>
              <Input
                type="date"
                value={fund.disbursementDate}
                onChange={(e) =>
                  setFund({ ...fund, disbursementDate: e.target.value })
                }
              />
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</>
              ) : (
                <><Send className="h-4 w-4" /> {t.submitFund}</>
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MultiLevelRequests;
