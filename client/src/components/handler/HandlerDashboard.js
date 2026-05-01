import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingApprovals,
  processApproval,
} from "../../Features/DigitalRequestSlice";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Wrench,
  Eye,
  Check,
  X,
  CalendarCheck,
  Loader2,
  Inbox,
  User,
} from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { getTranslation } from "../employee/DigitalRequests.translations";

const HandlerDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.users.user);
  const { pendingApprovals = [], isLoading } = useSelector(
    (state) => state.digitalRequests,
  );

  const { lang } = useLanguage();
  const t = (key) => getTranslation(lang, key);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // actionType: "" | "approve" | "complete" | "reject"
  const [actionType, setActionType] = useState("");
  const [comments, setComments] = useState("");
  const [completionDate, setCompletionDate] = useState("");

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchPendingApprovals(user._id));
    }
  }, [dispatch, user]);

  // Guard: only render for authenticated users
  if (!user) {
    return null;
  }

  const openRequestDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setActionType("");
    setComments("");
    setCompletionDate("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setActionType("");
    setComments("");
    setCompletionDate("");
  };

  const handleConfirmAction = async () => {
    if (actionType === "reject" && !comments.trim()) {
      toast.error(t("rejectReasonRequired"));
      return;
    }
    if (actionType === "complete" && !completionDate) {
      toast.error(t("completionDateRequired"));
      return;
    }

    const approvalData = {
      approverId: user._id,
      action: actionType === "reject" ? "Rejected" : "Approved",
      comment: comments,
    };

    if (actionType === "complete") {
      approvalData.expectedDeliveryDate = completionDate;
    }

    try {
      await dispatch(
        processApproval({
          requestId: selectedRequest.requestId,
          requestType: selectedRequest.requestType || "PurchaseRequest",
          approvalData,
        }),
      ).unwrap();

      toast.success(
        actionType === "reject"
          ? t("requestRejected")
          : actionType === "complete"
            ? t("requestCompleted")
            : t("requestApproved"),
      );

      closeModal();
      dispatch(fetchPendingApprovals(user._id));
    } catch (error) {
      toast.error(error || "An error occurred. Please try again.");
    }
  };

  const handleCancel = () => {
    setActionType("");
    setComments("");
    setCompletionDate("");
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Returns a meaningful display title regardless of request type
  const getDisplayTitle = (req) => {
    switch (req.requestType) {
      case "TransportRequest":
        return req.destination || req.requestId;
      case "FoodRequest":
        return req.occasionName || req.requestId;
      case "FundRequest":
        return req.purposeTitle || req.requestId;
      case "MaintenanceRequest":
        return req.description ? req.description.slice(0, 40) : req.requestId;
      case "PrintingRequest":
        return req.documentType || req.requestId;
      case "RiskReport":
        return req.riskType || req.requestId;
      default:
        return req.itemName || req.requestId;
    }
  };

  const TYPE_LABELS = {
    PurchaseRequest: "Purchase",
    TransportRequest: "Transport",
    FoodRequest: "Food",
    FundRequest: "Fund",
    MaintenanceRequest: "Maintenance",
    PrintingRequest: "Printing",
    RiskReport: "Risk Report",
  };

  const getUrgencyVariant = (urgency) => {
    switch (urgency) {
      case "High":
        return "destructive";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Wrench className="h-4 w-4" />
            {t("handlerDashboardTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("handlerDashboardSubtitle")}
          </p>
        </div>
        {pendingApprovals.length > 0 && (
          <Badge variant="destructive" className="ms-auto">
            {pendingApprovals.length}
          </Badge>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("loading")}</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && pendingApprovals.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <Inbox className="h-7 w-7" />
          <p className="text-sm">{t("noAssigned")}</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && pendingApprovals.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colRequestId")}</TableHead>
                  <TableHead>{t("colSubject")}</TableHead>
                  <TableHead>{t("colType")}</TableHead>
                  <TableHead>{t("colRequester")}</TableHead>
                  <TableHead>{t("colUrgency")}</TableHead>
                  <TableHead>{t("colSubmitted")}</TableHead>
                  <TableHead>{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell className="font-mono text-xs">
                      {request.requestId}
                    </TableCell>
                    <TableCell
                      className="max-w-[150px] truncate"
                      title={getDisplayTitle(request)}>
                      {getDisplayTitle(request)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[request.requestType] || "Request"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.requesterId?.personal_name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getUrgencyVariant(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRequestDetails(request)}>
                        <Eye className="me-1.5 h-3.5 w-3.5" />
                        {t("reviewAction")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Request Details Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {t("requestDetails")}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5 py-1">
              {/* Request Information */}
              <section>
                <h4 className="text-sm font-semibold mb-2">
                  {t("requestInformation")}
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("colRequestId")}
                    </p>
                    <p className="font-mono font-medium">
                      {selectedRequest.requestId}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("colType")}
                    </p>
                    <p className="font-medium">
                      {TYPE_LABELS[selectedRequest.requestType] || "Request"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("colSubject")}
                    </p>
                    <p className="font-medium">
                      {getDisplayTitle(selectedRequest)}
                    </p>
                  </div>
                  {selectedRequest.quantity && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldQuantity")}
                      </p>
                      <p>{selectedRequest.quantity}</p>
                    </div>
                  )}
                  {selectedRequest.destination && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldDestination")}
                      </p>
                      <p>{selectedRequest.destination}</p>
                    </div>
                  )}
                  {selectedRequest.departureDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldDeparture")}
                      </p>
                      <p>{formatDate(selectedRequest.departureDate)}</p>
                    </div>
                  )}
                  {selectedRequest.mealType && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldMealType")}
                      </p>
                      <p>{selectedRequest.mealType}</p>
                    </div>
                  )}
                  {selectedRequest.numberOfPersons && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldPersons")}
                      </p>
                      <p>{selectedRequest.numberOfPersons}</p>
                    </div>
                  )}
                  {selectedRequest.amountRequested && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldAmount")}
                      </p>
                      <p>
                        {selectedRequest.amountRequested}{" "}
                        {selectedRequest.currency || "OMR"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("colUrgency")}
                    </p>
                    <Badge variant={getUrgencyVariant(selectedRequest.urgency)}>
                      {selectedRequest.urgency}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("fieldSubmittedDate")}
                    </p>
                    <p>{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                </div>
                {(selectedRequest.justification || selectedRequest.purpose) && (
                  <div className="mt-2 rounded-md border border-border px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("fieldJustification")}
                    </p>
                    <p>
                      {selectedRequest.justification || selectedRequest.purpose}
                    </p>
                  </div>
                )}
                {selectedRequest.additionalNotes && (
                  <div className="mt-2 rounded-md border border-border px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("fieldAdditionalNotes")}
                    </p>
                    <p>{selectedRequest.additionalNotes}</p>
                  </div>
                )}
              </section>

              {/* Requester */}
              <section>
                <h4 className="text-sm font-semibold mb-2">
                  {t("requesterInformation")}
                </h4>
                <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {selectedRequest.requesterId?.personal_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRequest.requesterId?.department || "IT Staff"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Approval History */}
              {selectedRequest.approvalFlow &&
                selectedRequest.approvalFlow.some(
                  (h) => h.action !== "Pending",
                ) && (
                  <section>
                    <h4 className="text-sm font-semibold mb-3">
                      {t("approvalHistory")}
                    </h4>
                    <div className="relative border-s border-border ps-5 space-y-4">
                      {selectedRequest.approvalFlow
                        .filter((h) => h.action !== "Pending")
                        .map((history, index) => (
                          <div key={index} className="relative">
                            <div
                              className={`absolute -start-[21px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                history.action === "Approved"
                                  ? "border-green-600 bg-green-50"
                                  : "border-destructive bg-destructive/10"
                              }`}>
                              {history.action === "Approved" ? (
                                <Check className="h-2.5 w-2.5 text-green-700" />
                              ) : (
                                <X className="h-2.5 w-2.5 text-destructive" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {history.role}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {history.currentApprover}
                              </p>
                              <p className="text-xs mt-0.5">
                                <Badge
                                  variant={
                                    history.action === "Approved"
                                      ? "success"
                                      : "destructive"
                                  }
                                  className="text-[10px] py-0">
                                  {history.action}
                                </Badge>
                                {history.comment && (
                                  <span className="text-muted-foreground ms-1">
                                    {history.comment}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {history.timestamp
                                  ? formatDate(history.timestamp)
                                  : "Pending"}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>
                )}

              {/* ── Action Buttons ── */}
              {!actionType && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setActionType("approve")}>
                    <Check className="me-1.5 h-4 w-4 text-green-600" />
                    {t("approveAction")}
                  </Button>
                  {/* Complete (with delivery date) only for chain-mode PurchaseRequests */}
                  {selectedRequest.workflowMode !== "group" && (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setActionType("complete")}>
                      <CalendarCheck className="me-1.5 h-4 w-4" />
                      {t("completeAction")}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setActionType("reject")}>
                    <X className="me-1.5 h-4 w-4" />
                    {t("rejectAction")}
                  </Button>
                </div>
              )}

              {/* Approve Form */}
              {actionType === "approve" && (
                <section className="rounded-md border border-green-200 bg-green-50/50 px-4 py-4 space-y-3">
                  <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {t("approveRequest")}
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="approve-comments">
                      {t("commentsOptional")}
                    </Label>
                    <Textarea
                      id="approve-comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add any comments..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      {t("cancel")}
                    </Button>
                    <Button size="sm" onClick={handleConfirmAction}>
                      <Check className="me-1.5 h-3.5 w-3.5" />
                      {t("confirmApprove")}
                    </Button>
                  </div>
                </section>
              )}

              {/* Complete Form */}
              {actionType === "complete" && (
                <section className="rounded-md border border-blue-200 bg-blue-50/50 px-4 py-4 space-y-3">
                  <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    {t("completeRequest")}
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="completion-date">
                      {t("completionDate")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="completion-date"
                      type="date"
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="complete-comments">
                      {t("commentsOptional")}
                    </Label>
                    <Textarea
                      id="complete-comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add any completion notes..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      {t("cancel")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleConfirmAction}>
                      <CalendarCheck className="me-1.5 h-3.5 w-3.5" />
                      {t("confirmComplete")}
                    </Button>
                  </div>
                </section>
              )}

              {/* Reject Form */}
              {actionType === "reject" && (
                <section className="rounded-md border border-red-200 bg-red-50/50 px-4 py-4 space-y-3">
                  <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {t("rejectRequest")}
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="reject-reason">
                      {t("reasonForRejection")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="reject-reason"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Please provide a detailed reason..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleConfirmAction}>
                      <X className="me-1.5 h-3.5 w-3.5" />
                      {t("confirmReject")}
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HandlerDashboard;
