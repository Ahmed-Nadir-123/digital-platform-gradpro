import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { useSelector } from "react-redux";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import {
  ArrowLeft,
  FileText,
  Trophy,
  Upload,
  CheckCircle2,
  X,
} from "lucide-react";

const PrintRequestForm = () => {
  const user = useSelector((state) => state.users.user);
  const [documentType, setDocumentType] = useState("");
  const [orientation, setOrientation] = useState("Single Sided");
  const [stapling, setStapling] = useState("");
  const [numPages, setNumPages] = useState("");
  const [numSets, setNumSets] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const documentTypes = [
    {
      id: "exam-paper",
      name: "Exam Question Paper",
      icon: <FileText className="h-8 w-8" />,
    },
    {
      id: "official-cert",
      name: "Official Certificate",
      icon: <Trophy className="h-8 w-8" />,
    },
  ];

  useEffect(() => {
    if (numPages && numSets) {
      setTotalPages(parseInt(numPages) * parseInt(numSets));
    } else {
      setTotalPages(0);
    }
  }, [numPages, numSets]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFileError("");
    if (!file) return;
    const validExtensions = [".pdf", ".doc", ".docx"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      setFileError("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      setUploadedFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size must be less than 10MB");
      setUploadedFile(null);
      return;
    }
    setUploadedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentType || !orientation || !stapling || !numPages || !numSets) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!uploadedFile) {
      toast.error("Please upload your document");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("requesterId", user._id);
      formData.append("documentType", documentType);
      formData.append("orientation", orientation);
      formData.append("stapling", stapling);
      formData.append("numPages", numPages);
      formData.append("numSets", numSets);
      formData.append("notes", "");
      formData.append("document", uploadedFile);

      const response = await api.post("/printingRequests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        `Printing request submitted! ID: ${response.data.requestId}`,
      );
      setDocumentType("");
      setOrientation("Single Sided");
      setStapling("");
      setNumPages("");
      setNumSets("");
      setUploadedFile(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit printing request.",
      );
    }
  };

  /* â”€â”€ Select document type screen â”€â”€ */
  if (!documentType) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Select Document Type
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documentTypes.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setDocumentType(doc.id)}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-border bg-card p-8 text-center transition-colors hover:border-primary hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-muted-foreground">{doc.icon}</span>
              <div>
                <p className="font-semibold text-foreground">{doc.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* â”€â”€ Form screen â”€â”€ */
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDocumentType("")}
          aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Request for Printing
          </h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Printing Orientation</Label>
            <Select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
              required>
              <option value="Single Sided">Single Sided</option>
              <option value="Double Sided">Double Sided</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Stapling</Label>
            <Select
              value={stapling}
              onChange={(e) => setStapling(e.target.value)}
              required>
              <option value="">SELECT</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Number of Pages</Label>
            <Input
              type="number"
              min="1"
              value={numPages}
              onChange={(e) => setNumPages(e.target.value)}
              placeholder="Enter number of pages"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Number of Sets</Label>
            <Input
              type="number"
              min="1"
              value={numSets}
              onChange={(e) => setNumSets(e.target.value)}
              placeholder="Enter number of sets"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Total Number of Pages</Label>
          <Input
            type="number"
            value={totalPages}
            readOnly
            placeholder="Calculated automatically"
            className="bg-muted/40"
          />
        </div>

        {/* File upload */}
        <div className="space-y-1.5">
          <Label>
            Upload Document <span className="text-destructive">*</span>
          </Label>
          <label
            htmlFor="file-input"
            className="flex flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/20 px-4 py-8 text-center cursor-pointer hover:bg-muted/40 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-muted-foreground">
              PDF or Word documents (max 10MB)
            </span>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          {uploadedFile && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{uploadedFile.name}</span>
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="hover:text-green-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Important notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-amber-800 mb-2">
              Important Notice:
            </p>
            <ul className="space-y-1 text-xs text-amber-700 list-disc list-inside">
              <li>
                The requester must provide the document in PDF or hardcopy
                format.
              </li>
              <li>
                The requester must be present during the printing process.
              </li>
              <li>
                Printing must be arranged at least one day before the exam.
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDocumentType("")}>
            Back to Types
          </Button>
          <Button type="submit">Submit Request</Button>
        </div>
      </form>
    </div>
  );
};

export default PrintRequestForm;
