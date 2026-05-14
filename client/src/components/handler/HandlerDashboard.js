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
  Download,
} from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { getTranslation } from "../employee/DigitalRequests.translations";

const HandlerDashboard = ({ highlightId } = {}) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.users.user);
  const { pendingApprovals = [], isLoading } = useSelector(
    (state) => state.digitalRequests,
  );

  const { lang } = useLanguage();
  const t = (key) => getTranslation(lang, key);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // actionType: "" | "approve" | "progress" | "complete" | "reject"
  const [actionType, setActionType] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchPendingApprovals(user._id));
    }
  }, [dispatch, user]);

  // Auto-open request when navigating from a notification
  useEffect(() => {
    if (!highlightId || !pendingApprovals?.length) return;
    const match = pendingApprovals.find(
      (r) => (r.requestNumber || r.requestId) === highlightId,
    );
    if (match) openRequestDetails(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, pendingApprovals]);

  // Guard: only render for authenticated users
  if (!user) {
    return null;
  }

  const openRequestDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setActionType("");
    setComments("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setActionType("");
    setComments("");
  };

  const handleConfirmAction = async () => {
    if (actionType === "reject" && !comments.trim()) {
      toast.error(t("rejectReasonRequired"));
      return;
    }

    const requestTypeKey = (selectedRequest.requestType || "").toLowerCase();
    const isSingleLevel = ["installsoftwarerequest", "printingrequest", "riskreport"].includes(
      requestTypeKey,
    );
    const completionStatus =
      requestTypeKey === "riskreport" ? "resolved" : "completed";

    const approvalData = isSingleLevel
      ? {
          newStatus:
            actionType === "progress"
              ? "in_progress"
              : actionType === "complete"
                ? completionStatus
                : "rejected",
          notes: comments,
        }
      : {
          action: actionType === "reject" ? "rejected" : "approved",
          comments,
        };

    try {
      await dispatch(
        processApproval({
          requestId: selectedRequest.requestNumber || selectedRequest.requestId,
          requestType: selectedRequest.requestType || "PurchaseRequest",
          approvalData,
        }),
      ).unwrap();

      toast.success(
        actionType === "reject"
          ? t("requestRejected")
          : actionType === "complete"
            ? t("requestCompleted")
            : actionType === "progress"
              ? t("requestUpdated")
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
    switch ((req.requestType || "").toLowerCase()) {
      case "transportation":
        return req.destination || req.requestNumber || req.requestId;
      case "food":
        return req.eventName || req.requestNumber || req.requestId;
      case "fund":
        return req.fundPurpose || req.requestNumber || req.requestId;
      case "install_software":
        return req.softwareName || req.requestNumber || req.requestId;
      case "printing":
        return req.type || req.requestNumber || req.requestId;
      case "risk_report":
        return req.riskType || req.requestNumber || req.requestId;
      default:
        return req.itemDescription || req.requestNumber || req.requestId;
    }
  };

  const getRequesterName = (req) =>
    req.requesterName ||
    req.requesterId?.fullName ||
    req.requesterId?.personal_name ||
    req.requesterId?.name ||
    "N/A";

  const getApprovalTrail = (req) => req.approvalHistory || req.approvalFlow || [];

  const TYPE_LABELS = {
    purchase: "Purchase",
    purchaserequest: "Purchase",
    transportation: "Transport",
    transportrequest: "Transport",
    food: "Food",
    foodrequest: "Food",
    fund: "Fund",
    fundrequest: "Fund",
    install_software: "Install Software",
    installsoftwarerequest: "Install Software",
    printing: "Printing",
    printingrequest: "Printing",
    risk_report: "Risk Report",
    riskreport: "Risk Report",
  };

  const getUrgencyVariant = (urgency) => {
    const normalized = (urgency || "").toLowerCase();
    switch (normalized) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "secondary";
    }
  };

  const urgencyLabel = (urgency) => {
    const normalized = (urgency || "").toLowerCase();
    if (lang === "ar") {
      return normalized === "high" ? "عالي" : normalized === "medium" ? "متوسط" : normalized === "low" ? "منخفض" : urgency || "—";
    }
    return normalized === "high" ? "High" : normalized === "medium" ? "Medium" : normalized === "low" ? "Low" : urgency || "—";
  };

  const isSingleLevelRequest = selectedRequest
    ? ["installsoftwarerequest", "printingrequest", "riskreport"].includes(
        (selectedRequest.requestType || "").toLowerCase(),
      )
    : false;
  const completionLabel =
    (selectedRequest?.requestType || "").toLowerCase() === "riskreport"
      ? t("resolveAction")
      : t("completeAction");

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
                      {request.requestNumber || request.requestId}
                    </TableCell>
                    <TableCell
                      className="max-w-[150px] truncate"
                      title={getDisplayTitle(request)}>
                      {getDisplayTitle(request)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[(request.requestType || "").toLowerCase()] || "Request"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getRequesterName(request)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getUrgencyVariant(request.urgency || request.priority)}>
                        {urgencyLabel(request.urgency || request.priority)}
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
                      {selectedRequest.requestNumber || selectedRequest.requestId}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("colType")}
                    </p>
                    <p className="font-medium">
                      {TYPE_LABELS[(selectedRequest.requestType || "").toLowerCase()] || "Request"}
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
                  {selectedRequest.itemDescription && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldItemDescription")}
                      </p>
                      <p>{selectedRequest.itemDescription}</p>
                    </div>
                  )}
                  {selectedRequest.quantity && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldQuantity")}
                      </p>
                      <p>{selectedRequest.quantity}</p>
                    </div>
                  )}
                  {selectedRequest.estimatedCost && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldEstimatedCost")}
                      </p>
                      <p>{selectedRequest.estimatedCost}</p>
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
                  {selectedRequest.tripPurpose && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldTripPurpose")}
                      </p>
                      <p>{selectedRequest.tripPurpose}</p>
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
                  {selectedRequest.returnDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldReturnDate")}
                      </p>
                      <p>{formatDate(selectedRequest.returnDate)}</p>
                    </div>
                  )}
                  {selectedRequest.numberOfPassengers && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldPassengers")}
                      </p>
                      <p>{selectedRequest.numberOfPassengers}</p>
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
                  {selectedRequest.eventName && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldEventName")}
                      </p>
                      <p>{selectedRequest.eventName}</p>
                    </div>
                  )}
                  {selectedRequest.eventLocation && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldEventLocation")}
                      </p>
                      <p>{selectedRequest.eventLocation}</p>
                    </div>
                  )}
                  {selectedRequest.numberOfAttendees && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldAttendees")}
                      </p>
                      <p>{selectedRequest.numberOfAttendees}</p>
                    </div>
                  )}
                  {selectedRequest.fundPurpose && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldFundPurpose")}
                      </p>
                      <p>{selectedRequest.fundPurpose}</p>
                    </div>
                  )}
                  {selectedRequest.requestedAmount != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldRequestedAmount")}
                      </p>
                      <p>
                        {selectedRequest.requestedAmount}{" "}
                        {selectedRequest.currency || "OMR"}
                      </p>
                    </div>
                  )}
                  {selectedRequest.softwareName && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldSoftwareName")}
                      </p>
                      <p>{selectedRequest.softwareName}</p>
                    </div>
                  )}
                  {selectedRequest.installationLocation && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldInstallLocation")}
                      </p>
                      <p>{selectedRequest.installationLocation}</p>
                    </div>
                  )}
                  {selectedRequest.type && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldPrintType")}
                      </p>
                      <p>{selectedRequest.type}</p>
                    </div>
                  )}
                  {selectedRequest.pagesPerExam && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldPagesPerExam")}
                      </p>
                      <p>{selectedRequest.pagesPerExam}</p>
                    </div>
                  )}
                  {selectedRequest.setsCount && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldSetsCount")}
                      </p>
                      <p>{selectedRequest.setsCount}</p>
                    </div>
                  )}
                  {selectedRequest.recipientName && (
                    <div>
                      <p className="text-muted-foreground text-xs">Recipient Name</p>
                      <p>{selectedRequest.recipientName}</p>
                    </div>
                  )}
                  {selectedRequest.riskType && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldRiskType")}
                      </p>
                      <p>{selectedRequest.riskType}</p>
                    </div>
                  )}
                  {selectedRequest.severity && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldSeverity")}
                      </p>
                      <p>{selectedRequest.severity}</p>
                    </div>
                  )}
                  {selectedRequest.likelihood && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldLikelihood")}
                      </p>
                      <p>{selectedRequest.likelihood}</p>
                    </div>
                  )}
                  {selectedRequest.incidentDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("fieldIncidentDate")}
                      </p>
                      <p>{formatDate(selectedRequest.incidentDate)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("colUrgency")}
                    </p>
                    <Badge variant={getUrgencyVariant(selectedRequest.urgency || selectedRequest.priority)}>
                      {urgencyLabel(selectedRequest.urgency || selectedRequest.priority)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {t("fieldSubmittedDate")}
                    </p>
                    <p>{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                </div>
                {/* Attached files (printing) */}
                {(selectedRequest.examFileUrl || selectedRequest.certificateFileUrl || selectedRequest.recipientsListUrl) && (
                  <div className="mt-2 rounded-md border border-border px-3 py-2 space-y-1.5">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1">
                      <Download className="h-3 w-3" /> Attached Files
                    </p>
                    {(selectedRequest.examFileUrl || selectedRequest.certificateFileUrl) && (
                      <a
                        href={`${process.env.REACT_APP_API_URL || "http://localhost:8080"}/${selectedRequest.examFileUrl || selectedRequest.certificateFileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline">
                        <Download className="h-3.5 w-3.5 shrink-0" />
                        Download Document
                      </a>
                    )}
                    {selectedRequest.recipientsListUrl && (
                      <a
                        href={`${process.env.REACT_APP_API_URL || "http://localhost:8080"}/${selectedRequest.recipientsListUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline">
                        <Download className="h-3.5 w-3.5 shrink-0" />
                        Download Recipients List
                      </a>
                    )}
                  </div>
                )}

                {(selectedRequest.justification || selectedRequest.tripPurpose || selectedRequest.fundPurpose) && (
                  <div className="mt-2 rounded-md border border-border px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("fieldJustification")}
                    </p>
                    <p>
                      {selectedRequest.justification ||
                        selectedRequest.tripPurpose ||
                        selectedRequest.fundPurpose}
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
                      {getRequesterName(selectedRequest) || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRequest.department ||
                        selectedRequest.requesterId?.department ||
                        "IT Staff"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Approval History */}
              {getApprovalTrail(selectedRequest).length > 0 &&
                getApprovalTrail(selectedRequest).some(
                  (h) => h.action !== "Pending",
                ) && (
                  <section>
                    <h4 className="text-sm font-semibold mb-3">
                      {t("approvalHistory")}
                    </h4>
                    <div className="relative border-s border-border ps-5 space-y-4">
                      {getApprovalTrail(selectedRequest)
                        .filter((h) => (h.action || "").toLowerCase() !== "pending")
                        .map((history, index) => (
                          <div key={index} className="relative">
                            {(() => {
                              const action = (history.action || "").toLowerCase();
                              const isApproved = ["approved", "completed", "resolved"].includes(action);
                              const isRejected = action === "rejected";
                              const label = history.action || "";
                              return (
                            <>
                            <div
                              className={`absolute -start-[21px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                isApproved
                                  ? "border-green-600 bg-green-50"
                                  : isRejected
                                    ? "border-destructive bg-destructive/10"
                                    : "border-border bg-muted"
                              }`}>
                              {isApproved ? (
                                <Check className="h-2.5 w-2.5 text-green-700" />
                              ) : isRejected ? (
                                <X className="h-2.5 w-2.5 text-destructive" />
                              ) : null}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {history.approverRole || history.role}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {history.approverName || history.currentApprover}
                              </p>
                              <p className="text-xs mt-0.5">
                                <Badge
                                  variant={
                                    isApproved
                                      ? "success"
                                      : isRejected
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className="text-[10px] py-0">
                                  {label}
                                </Badge>
                                {(history.comments || history.comment) && (
                                  <span className="text-muted-foreground ms-1">
                                    {history.comments || history.comment}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {history.timestamp
                                  ? formatDate(history.timestamp)
                                  : "Pending"}
                              </p>
                            </div>
                            </>
                              );
                            })()}
                          </div>
                        ))}
                    </div>
                  </section>
                )}

              {/* ── Action Buttons ── */}
              {!actionType && (
                <div className="flex gap-2">
                  {isSingleLevelRequest ? (
                    <>
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => setActionType("progress")}>
                        <CalendarCheck className="me-1.5 h-4 w-4 text-blue-600" />
                        {t("progressAction")}
                      </Button>
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setActionType("complete")}>
                        <Check className="me-1.5 h-4 w-4" />
                        {completionLabel}
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => setActionType("approve")}>
                      <Check className="me-1.5 h-4 w-4 text-green-600" />
                      {t("approveAction")}
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

              {/* Progress Form */}
              {actionType === "progress" && (
                <section className="rounded-md border border-blue-200 bg-blue-50/50 px-4 py-4 space-y-3">
                  <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    {t("progressRequest")}
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="progress-comments">
                      {t("commentsOptional")}
                    </Label>
                    <Textarea
                      id="progress-comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add any notes..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      {t("cancel")}
                    </Button>
                    <Button size="sm" onClick={handleConfirmAction}>
                      <CalendarCheck className="me-1.5 h-3.5 w-3.5" />
                      {t("confirmProgress")}
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
