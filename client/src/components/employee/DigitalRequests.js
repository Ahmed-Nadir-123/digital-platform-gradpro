import React, { useState } from "react";
import { getTranslation } from "./DigitalRequests.translations";
import { useDispatch, useSelector } from "react-redux";
import { createPurchaseRequest } from "../../Features/DigitalRequestSlice";
import {
  buyingSchemaValidation,
  transportSchemaValidation,
  foodSchemaValidation,
  fundSchemaValidation,
} from "../../Validations/DigitalRequestValidation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import PrintRequestForm from "./PrintRequestForm";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { useLanguage } from "../../lib/LanguageContext";
import toast from "react-hot-toast";
import {
  Laptop,
  Printer,
  AlertTriangle,
  Send,
  Loader2,
  ShoppingCart,
  Car,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

const DigitalRequests = () => {
  const [activeTab, setActiveTab] = useState("software");
  const { lang } = useLanguage();
  const t = (key) => getTranslation(lang, key);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.users.user);
  const { isLoading } = useSelector((state) => state.digitalRequests);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(buyingSchemaValidation),
    defaultValues: {
      items: "",
      quantity: "",
      urgency: "Medium",
      justification: "",
      estimatedBudget: "",
      additionalNotes: "",
    },
  });

  const [riskFormData, setRiskFormData] = useState({
    location: "",
    riskType: "",
    urgency: "Medium",
    description: "",
    actionRequested: "",
  });

  const [purchaseFormData, setPurchaseFormData] = useState({
    itemName: "",
    quantity: "",
    urgency: "Medium",
    estimatedBudget: "",
    justification: "",
    additionalNotes: "",
  });

  const [transportFormData, setTransportFormData] = useState({
    destination: "",
    departureDate: "",
    returnDate: "",
    numberOfPassengers: "",
    purpose: "",
    urgency: "Medium",
    additionalNotes: "",
  });

  const [foodFormData, setFoodFormData] = useState({
    occasionName: "",
    eventDate: "",
    numberOfPersons: "",
    mealType: "Lunch",
    location: "",
    dietaryRequirements: "",
    urgency: "Medium",
    additionalNotes: "",
  });

  const [fundFormData, setFundFormData] = useState({
    purposeTitle: "",
    amountRequested: "",
    currency: "OMR",
    urgency: "Medium",
    justification: "",
    expectedDateNeeded: "",
    additionalNotes: "",
  });

  const validateWithSchema = async (schema, values) => {
    try {
      await schema.validate(values, { abortEarly: false });
      return null;
    } catch (error) {
      return error?.errors?.[0] || t("errFillRequired");
    }
  };

  const onSubmitSoftware = async (data) => {
    try {
      const result = await dispatch(
        createPurchaseRequest({
          requesterId: user._id,
          itemName: data.items,
          quantity: data.quantity,
          urgency: data.urgency,
          estimatedBudget: data.estimatedBudget,
          justification: data.justification,
          additionalNotes: data.additionalNotes,
          requestCategory: "Software",
        }),
      );

      if (result.type === "digitalRequests/create/fulfilled") {
        toast.success(`Request submitted! ID: ${result.payload.requestId}`);
        reset();
      } else {
        toast.error(result.payload || t("errSubmitFailed"));
      }
    } catch (error) {
      console.log("Error submitting software request:", error);
      toast.error(t("errGeneral"));
    }
  };

  const onSubmitRisk = async (e) => {
    e.preventDefault();
    const { location, riskType, urgency, description, actionRequested } =
      riskFormData;
    if (!location || !riskType || !description) {
      toast.error(t("errFillRequired"));
      return;
    }
    try {
      const response = await import("../../lib/api").then((m) =>
        m.default.post("/riskReports", {
          requesterId: user._id,
          location,
          riskType,
          urgency,
          description,
          actionRequested,
        }),
      );
      toast.success(`Risk report submitted! ID: ${response.data.requestId}`);
      setRiskFormData({
        location: "",
        riskType: "",
        urgency: "Medium",
        description: "",
        actionRequested: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || t("errRiskFailed"));
    }
  };

  const onSubmitPurchase = async (e) => {
    e.preventDefault();
    const {
      itemName,
      quantity,
      urgency,
      estimatedBudget,
      justification,
      additionalNotes,
    } = purchaseFormData;
    if (!itemName || !quantity || !justification) {
      toast.error(t("errFillRequired"));
      return;
    }
    try {
      const result = await dispatch(
        createPurchaseRequest({
          requesterId: user._id,
          itemName,
          quantity,
          urgency,
          estimatedBudget,
          justification,
          additionalNotes,
          requestCategory: "Purchase",
        }),
      );
      if (result.type === "digitalRequests/create/fulfilled") {
        toast.success(`Request submitted! ID: ${result.payload.requestId}`);
        setPurchaseFormData({
          itemName: "",
          quantity: "",
          urgency: "Medium",
          estimatedBudget: "",
          justification: "",
          additionalNotes: "",
        });
      } else {
        toast.error(result.payload || t("errSubmitFailed"));
      }
    } catch (error) {
      toast.error(t("errGeneral"));
    }
  };

  const onSubmitTransport = async (e) => {
    e.preventDefault();
    const {
      destination,
      departureDate,
      returnDate,
      numberOfPassengers,
      purpose,
      urgency,
      additionalNotes,
    } = transportFormData;
    const transportError = await validateWithSchema(transportSchemaValidation, {
      destination,
      departureDate,
      returnDate,
      numberOfPassengers,
      purpose,
      urgency,
      additionalNotes,
    });
    if (transportError) {
      toast.error(transportError);
      return;
    }
    try {
      const { default: api } = await import("../../lib/api");
      const response = await api.post("/transportRequests", {
        requesterId: user._id,
        destination,
        departureDate,
        returnDate: returnDate || null,
        numberOfPassengers: Number(numberOfPassengers),
        purpose,
        urgency,
        additionalNotes,
      });
      toast.success(
        `Transport request submitted! ID: ${response.data.requestId}`,
      );
      setTransportFormData({
        destination: "",
        departureDate: "",
        returnDate: "",
        numberOfPassengers: "",
        purpose: "",
        urgency: "Medium",
        additionalNotes: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || t("errTransportFailed"));
    }
  };

  const onSubmitFood = async (e) => {
    e.preventDefault();
    const {
      occasionName,
      eventDate,
      numberOfPersons,
      mealType,
      location,
      dietaryRequirements,
      urgency,
      additionalNotes,
    } = foodFormData;
    const foodError = await validateWithSchema(foodSchemaValidation, {
      occasionName,
      eventDate,
      numberOfPersons,
      mealType,
      location,
      dietaryRequirements,
      urgency,
      additionalNotes,
    });
    if (foodError) {
      toast.error(foodError);
      return;
    }
    try {
      const { default: api } = await import("../../lib/api");
      const response = await api.post("/foodRequests", {
        requesterId: user._id,
        occasionName,
        eventDate,
        numberOfPersons: Number(numberOfPersons),
        mealType,
        location,
        dietaryRequirements,
        urgency,
        additionalNotes,
      });
      toast.success(`Food request submitted! ID: ${response.data.requestId}`);
      setFoodFormData({
        occasionName: "",
        eventDate: "",
        numberOfPersons: "",
        mealType: "Lunch",
        location: "",
        dietaryRequirements: "",
        urgency: "Medium",
        additionalNotes: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || t("errFoodFailed"));
    }
  };

  const onSubmitFund = async (e) => {
    e.preventDefault();
    const {
      purposeTitle,
      amountRequested,
      currency,
      urgency,
      justification,
      expectedDateNeeded,
      additionalNotes,
    } = fundFormData;
    const fundError = await validateWithSchema(fundSchemaValidation, {
      purposeTitle,
      amountRequested,
      currency,
      urgency,
      justification,
      expectedDateNeeded,
      additionalNotes,
    });
    if (fundError) {
      toast.error(fundError);
      return;
    }
    try {
      const { default: api } = await import("../../lib/api");
      const response = await api.post("/fundRequests", {
        requesterId: user._id,
        purposeTitle,
        amountRequested: Number(amountRequested),
        currency,
        urgency,
        justification,
        expectedDateNeeded: expectedDateNeeded || null,
        additionalNotes,
      });
      toast.success(`Fund request submitted! ID: ${response.data.requestId}`);
      setFundFormData({
        purposeTitle: "",
        amountRequested: "",
        currency: "OMR",
        urgency: "Medium",
        justification: "",
        expectedDateNeeded: "",
        additionalNotes: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || t("errFundFailed"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {[
          {
            id: "software",
            label: t("softwareTab"),
            icon: <Laptop className="h-5 w-5" />,
          },
          {
            id: "printing",
            label: t("printingTab"),
            icon: <Printer className="h-5 w-5" />,
          },
          {
            id: "risk",
            label: t("riskTab"),
            icon: <AlertTriangle className="h-5 w-5" />,
          },
          {
            id: "purchase",
            label: t("purchaseTab"),
            icon: <ShoppingCart className="h-5 w-5" />,
          },
          {
            id: "transport",
            label: t("transportTab"),
            icon: <Car className="h-5 w-5" />,
          },
          {
            id: "food",
            label: t("foodTab"),
            icon: <UtensilsCrossed className="h-5 w-5" />,
          },
          {
            id: "fund",
            label: t("fundTab"),
            icon: <Wallet className="h-5 w-5" />,
          },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors
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

      {/* Software Tab */}
      {activeTab === "software" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Laptop className="h-5 w-5 text-muted-foreground" />
            {t("softwareTitle")}
          </h3>
          <form onSubmit={handleSubmit(onSubmitSoftware)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                {t("itemsLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Textarea
                {...register("items")}
                placeholder={t("itemsPlaceholder")}
                rows={4}
                className={
                  errors.items
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.items && (
                <p className="text-xs text-destructive">
                  {errors.items.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {t("quantityLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Input
                  {...register("quantity")}
                  type="text"
                  placeholder={t("quantityPlaceholder")}
                  className={errors.quantity ? "border-destructive" : ""}
                />
                {errors.quantity && (
                  <p className="text-xs text-destructive">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("urgencyLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Select
                  {...register("urgency")}
                  className={errors.urgency ? "border-destructive" : ""}>
                  <option value="Low">{t("urgencyLow")}</option>
                  <option value="Medium">{t("urgencyMedium")}</option>
                  <option value="High">{t("urgencyHigh")}</option>
                </Select>
                {errors.urgency && (
                  <p className="text-xs text-destructive">
                    {errors.urgency.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("budgetLabel")}</Label>
              <Input
                {...register("estimatedBudget")}
                type="number"
                placeholder={t("budgetPlaceholder")}
                className={errors.estimatedBudget ? "border-destructive" : ""}
              />
              {errors.estimatedBudget && (
                <p className="text-xs text-destructive">
                  {errors.estimatedBudget.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                {t("justificationLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Textarea
                {...register("justification")}
                placeholder={t("justificationPlaceholder")}
                rows={4}
                className={errors.justification ? "border-destructive" : ""}
              />
              {errors.justification && (
                <p className="text-xs text-destructive">
                  {errors.justification.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Additional Notes{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Textarea
                {...register("additionalNotes")}
                placeholder="Any special instructions or notes..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> {t("submitSoftware")}
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Printing Tab */}
      {activeTab === "printing" && (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Printer className="h-5 w-5 text-muted-foreground" />
            {t("printingTab")}
          </h3>
          <PrintRequestForm />
        </div>
      )}

      {/* Risk Tab */}
      {activeTab === "risk" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            {t("riskTab")}
          </h3>
          <form onSubmit={onSubmitRisk} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Risk Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., Lab 2, Building C"
                  value={riskFormData.location}
                  onChange={(e) =>
                    setRiskFormData({
                      ...riskFormData,
                      location: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Risk Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={riskFormData.riskType}
                  onChange={(e) =>
                    setRiskFormData({
                      ...riskFormData,
                      riskType: e.target.value,
                    })
                  }
                  required>
                  <option value="">Select risk type</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Fire Hazard">Fire Hazard</option>
                  <option value="Safety Obstruction">Safety Obstruction</option>
                  <option value="Facility Damage">Facility Damage</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Urgency <span className="text-destructive">*</span>
              </Label>
              <Select
                value={riskFormData.urgency}
                onChange={(e) =>
                  setRiskFormData({ ...riskFormData, urgency: e.target.value })
                }
                required>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={4}
                placeholder="Describe the observed risk in detail..."
                value={riskFormData.description}
                onChange={(e) =>
                  setRiskFormData({
                    ...riskFormData,
                    description: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Requested Action</Label>
              <Textarea
                rows={3}
                placeholder="Optional: suggested action to resolve the risk"
                value={riskFormData.actionRequested}
                onChange={(e) =>
                  setRiskFormData({
                    ...riskFormData,
                    actionRequested: e.target.value,
                  })
                }
              />
            </div>

            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" />
              {t("submitRisk")}
            </Button>
          </form>
        </div>
      )}

      {/* Purchase Tab */}
      {activeTab === "purchase" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            {t("purchaseTitle")}
          </h3>
          <form onSubmit={onSubmitPurchase} className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                {t("purchaseItemLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Textarea
                rows={3}
                placeholder={t("purchaseItemPlaceholder")}
                value={purchaseFormData.itemName}
                onChange={(e) =>
                  setPurchaseFormData({
                    ...purchaseFormData,
                    itemName: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {t("purchaseQuantityLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Input
                  type="text"
                  placeholder={t("purchaseQuantityPlaceholder")}
                  value={purchaseFormData.quantity}
                  onChange={(e) =>
                    setPurchaseFormData({
                      ...purchaseFormData,
                      quantity: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("urgencyLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Select
                  value={purchaseFormData.urgency}
                  onChange={(e) =>
                    setPurchaseFormData({
                      ...purchaseFormData,
                      urgency: e.target.value,
                    })
                  }>
                  <option value="Low">{t("urgencyLow")}</option>
                  <option value="Medium">{t("urgencyMedium")}</option>
                  <option value="High">{t("urgencyHigh")}</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("budgetLabel")}</Label>
              <Input
                type="number"
                placeholder={t("budgetPlaceholder")}
                value={purchaseFormData.estimatedBudget}
                onChange={(e) =>
                  setPurchaseFormData({
                    ...purchaseFormData,
                    estimatedBudget: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                {t("justificationLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Textarea
                rows={4}
                placeholder={t("justificationPlaceholder")}
                value={purchaseFormData.justification}
                onChange={(e) =>
                  setPurchaseFormData({
                    ...purchaseFormData,
                    justification: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Additional Notes{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Textarea
                rows={2}
                placeholder="Any special instructions or notes..."
                value={purchaseFormData.additionalNotes}
                onChange={(e) =>
                  setPurchaseFormData({
                    ...purchaseFormData,
                    additionalNotes: e.target.value,
                  })
                }
              />
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> {t("submitPurchase")}
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Transport Tab */}
      {activeTab === "transport" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Car className="h-5 w-5 text-muted-foreground" />
            {t("transportTitle")}
          </h3>
          <form onSubmit={onSubmitTransport} className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                {t("transportDestLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Input
                type="text"
                placeholder={t("transportDestPlaceholder")}
                value={transportFormData.destination}
                onChange={(e) =>
                  setTransportFormData({
                    ...transportFormData,
                    destination: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {t("transportDepartureDateLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={transportFormData.departureDate}
                  onChange={(e) =>
                    setTransportFormData({
                      ...transportFormData,
                      departureDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("transportReturnDateLabel")}</Label>
                <Input
                  type="datetime-local"
                  value={transportFormData.returnDate}
                  onChange={(e) =>
                    setTransportFormData({
                      ...transportFormData,
                      returnDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {t("transportPassengersLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder={t("transportPassengersPlaceholder")}
                  value={transportFormData.numberOfPassengers}
                  onChange={(e) =>
                    setTransportFormData({
                      ...transportFormData,
                      numberOfPassengers: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("urgencyLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Select
                  value={transportFormData.urgency}
                  onChange={(e) =>
                    setTransportFormData({
                      ...transportFormData,
                      urgency: e.target.value,
                    })
                  }>
                  <option value="Low">{t("urgencyLow")}</option>
                  <option value="Medium">{t("urgencyMedium")}</option>
                  <option value="High">{t("urgencyHigh")}</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                {t("transportPurposeLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Textarea
                rows={3}
                placeholder={t("transportPurposePlaceholder")}
                value={transportFormData.purpose}
                onChange={(e) =>
                  setTransportFormData({
                    ...transportFormData,
                    purpose: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Additional Notes{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Textarea
                rows={2}
                placeholder="Any additional details..."
                value={transportFormData.additionalNotes}
                onChange={(e) =>
                  setTransportFormData({
                    ...transportFormData,
                    additionalNotes: e.target.value,
                  })
                }
              />
            </div>

            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" />
              {t("submitTransport")}
            </Button>
          </form>
        </div>
      )}

      {/* Food Tab */}
      {activeTab === "food" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            {t("foodTitle")}
          </h3>
          <form onSubmit={onSubmitFood} className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                {t("foodOccasionLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Input
                type="text"
                placeholder={t("foodOccasionPlaceholder")}
                value={foodFormData.occasionName}
                onChange={(e) =>
                  setFoodFormData({
                    ...foodFormData,
                    occasionName: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {t("foodDateLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Input
                  type="date"
                  value={foodFormData.eventDate}
                  onChange={(e) =>
                    setFoodFormData({
                      ...foodFormData,
                      eventDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("foodPersonsLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder={t("foodPersonsPlaceholder")}
                  value={foodFormData.numberOfPersons}
                  onChange={(e) =>
                    setFoodFormData({
                      ...foodFormData,
                      numberOfPersons: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {t("foodMealTypeLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Select
                  value={foodFormData.mealType}
                  onChange={(e) =>
                    setFoodFormData({
                      ...foodFormData,
                      mealType: e.target.value,
                    })
                  }
                  required>
                  <option value="Breakfast">{t("foodMealBreakfast")}</option>
                  <option value="Lunch">{t("foodMealLunch")}</option>
                  <option value="Dinner">{t("foodMealDinner")}</option>
                  <option value="Snacks">{t("foodMealSnacks")}</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("urgencyLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Select
                  value={foodFormData.urgency}
                  onChange={(e) =>
                    setFoodFormData({
                      ...foodFormData,
                      urgency: e.target.value,
                    })
                  }>
                  <option value="Low">{t("urgencyLow")}</option>
                  <option value="Medium">{t("urgencyMedium")}</option>
                  <option value="High">{t("urgencyHigh")}</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                {t("foodLocationLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Input
                type="text"
                placeholder={t("foodLocationPlaceholder")}
                value={foodFormData.location}
                onChange={(e) =>
                  setFoodFormData({ ...foodFormData, location: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("foodDietaryLabel")}</Label>
              <Textarea
                rows={2}
                placeholder={t("foodDietaryPlaceholder")}
                value={foodFormData.dietaryRequirements}
                onChange={(e) =>
                  setFoodFormData({
                    ...foodFormData,
                    dietaryRequirements: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Additional Notes{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Textarea
                rows={2}
                placeholder="Any additional details..."
                value={foodFormData.additionalNotes}
                onChange={(e) =>
                  setFoodFormData({
                    ...foodFormData,
                    additionalNotes: e.target.value,
                  })
                }
              />
            </div>

            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" />
              {t("submitFood")}
            </Button>
          </form>
        </div>
      )}

      {/* Fund Tab */}
      {activeTab === "fund" && (
        <div className="max-w-2xl space-y-5 mx-auto">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            {t("fundTitle")}
          </h3>
          <form onSubmit={onSubmitFund} className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                {t("fundPurposeLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Input
                type="text"
                placeholder={t("fundPurposePlaceholder")}
                value={fundFormData.purposeTitle}
                onChange={(e) =>
                  setFundFormData({
                    ...fundFormData,
                    purposeTitle: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {t("fundAmountLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder={t("fundAmountPlaceholder")}
                  value={fundFormData.amountRequested}
                  onChange={(e) =>
                    setFundFormData({
                      ...fundFormData,
                      amountRequested: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("urgencyLabel")}{" "}
                  <span className="text-destructive">{t("required")}</span>
                </Label>
                <Select
                  value={fundFormData.urgency}
                  onChange={(e) =>
                    setFundFormData({
                      ...fundFormData,
                      urgency: e.target.value,
                    })
                  }>
                  <option value="Low">{t("urgencyLow")}</option>
                  <option value="Medium">{t("urgencyMedium")}</option>
                  <option value="High">{t("urgencyHigh")}</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("fundExpectedDateLabel")}</Label>
              <Input
                type="date"
                value={fundFormData.expectedDateNeeded}
                onChange={(e) =>
                  setFundFormData({
                    ...fundFormData,
                    expectedDateNeeded: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                {t("justificationLabel")}{" "}
                <span className="text-destructive">{t("required")}</span>
              </Label>
              <Textarea
                rows={4}
                placeholder={t("justificationPlaceholder")}
                value={fundFormData.justification}
                onChange={(e) =>
                  setFundFormData({
                    ...fundFormData,
                    justification: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Additional Notes{" "}
                <span className="text-muted-foreground text-xs">
                  (Optional)
                </span>
              </Label>
              <Textarea
                rows={2}
                placeholder="Any additional details..."
                value={fundFormData.additionalNotes}
                onChange={(e) =>
                  setFundFormData({
                    ...fundFormData,
                    additionalNotes: e.target.value,
                  })
                }
              />
            </div>

            <Button type="submit" className="gap-2">
              <Send className="h-4 w-4" />
              {t("submitFund")}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DigitalRequests;
