import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
import { CheckCircle2, Wrench, Loader2 } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const HelpDeskForm = () => {
  const user = useSelector((state) => state.users.user);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    type: "",
    severity: "Low",
    dateTime: "",
    contactNo: "",
    description: "",
    remarks: "",
    risk: "No",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/maintenanceRequests", {
        ...formData,
        requesterId: user?._id || null,
      });
      setSubmitted(true);
      setFormData({
        name: "",
        location: "",
        type: "",
        severity: "Low",
        dateTime: "",
        contactNo: "",
        description: "",
        remarks: "",
        risk: "No",
      });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const SectionTitle = ({ step, label, variant = "default" }) => (
    <div className="flex items-center gap-2 mb-4">
      <Badge
        variant={variant}
        className="h-6 w-6 flex items-center justify-center p-0 text-xs rounded-full">
        {step}
      </Badge>
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Wrench className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            UTAS Maintenance Help Desk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your maintenance request below
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {submitted && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Request submitted successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1 — Personal */}
              <section>
                <SectionTitle step="1" label="Personal Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">
                      Name (الاسم) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactNo">
                      Office Contact No. (رقم المكتب){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="contactNo"
                      name="contactNo"
                      placeholder="e.g. 241..."
                      value={formData.contactNo}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Section 2 — Request Details */}
              <section>
                <SectionTitle
                  step="2"
                  label="Request Details"
                  variant="secondary"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="location">
                      Location (الموقع){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required>
                      <option value="">Select location</option>
                      <option>IT 201 Staff Room 1</option>
                      <option>IT 202 Lab</option>
                      <option>Main Office</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="type">
                      Type (النوع) <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required>
                      <option value="">Select type</option>
                      <option>Electricity &amp; Accessories (كهربائي)</option>
                      <option>Plumbing (سباكة)</option>
                      <option>Furniture (أثاث)</option>
                      <option>Network (شبكة)</option>
                    </Select>
                  </div>
                </div>
              </section>

              {/* Section 3 — Priority */}
              <section>
                <SectionTitle
                  step="3"
                  label="Priority & Timeline"
                  variant="warning"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="severity">Severity (الأهمية)</Label>
                    <Select
                      id="severity"
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dateTime">
                      Date/Time (تاريخ ووقت الطلب)
                    </Label>
                    <Input
                      type="datetime-local"
                      id="dateTime"
                      name="dateTime"
                      value={formData.dateTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>

              {/* Section 4 — Description */}
              <section>
                <SectionTitle
                  step="4"
                  label="Description & Remarks"
                  variant="destructive"
                />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="description">
                      Briefly describe the problem:{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Write a short description of the issue..."
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="remarks">
                      Additional Remarks (ملاحظات)
                    </Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      placeholder="Any additional information..."
                      rows={2}
                      value={formData.remarks}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </section>

              {/* Section 5 — Risk */}
              <section>
                <SectionTitle
                  step="5"
                  label="Risk Assessment"
                  variant="secondary"
                />
                <p className="mb-3 text-sm text-muted-foreground">
                  Do you consider it a risk? (هل تعتبرها خطرة؟)
                </p>
                <div className="flex gap-6">
                  {[
                    { value: "Yes", label: "Yes — High Priority" },
                    { value: "No", label: "No — Regular Priority" },
                  ].map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="risk"
                        value={value}
                        checked={formData.risk === value}
                        onChange={handleChange}
                        className="accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </section>

              {/* Submit */}
              <div className="pt-2 border-t border-border flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  * Fields marked with (الاسم), (رقم المكتب), (الموقع), and
                  (النوع) are required.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpDeskForm;
