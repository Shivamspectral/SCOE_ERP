import React, { useState } from "react";
import { FileBadge, Download, CheckCircle2, Clock, Printer, ShieldCheck } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { student, college } from "../data/portalData";
import { usePortal } from "../context/PortalContext";

export function DocumentsPage() {
  const { toast } = usePortal();

  const documents = [
    { id: "doc1", title: "College Fee Payment Receipt", session: "AY 2025-26 (Semester V)", status: "Available", date: "12 Jul 2025", type: "Financial", filename: "FeeReceipt_SCOE2023CE042.pdf" },
    { id: "doc2", title: "Bonafide Student Certificate", session: "Valid for Passport / Bus Pass / Bank", status: "Available", date: "Immediate", type: "Academic", filename: "Bonafide_Certificate_Rahul_Patil.pdf" },
    { id: "doc3", title: "Official Academic Transcript (Sem I to IV)", session: "SPPU Pune Attested", status: "Available", date: "02 Aug 2025", type: "Academic", filename: "Official_Transcript_SCOE2023CE042.pdf" },
    { id: "doc4", title: "No Objection Certificate (NOC) for Internship", session: "Winter 2026 Industry Internship", status: "Request", date: "24-hour turnaround", type: "Administrative", filename: "NOC_Request.pdf" },
    { id: "doc5", title: "Student Council Appointment Letter", session: "Technical Secretary 2025-26", status: "Available", date: "12 Sep 2025", type: "Council", filename: "Council_Appointment_SCOE.pdf" },
  ];

  const handleDownloadDoc = (doc) => {
    toast({
      title: `Downloaded: ${doc.title}`,
      description: `${doc.filename} generated with official digital seal.`,
      variant: "success",
    });
  };

  const handleRequestDoc = (doc) => {
    toast({
      title: `Requested: ${doc.title}`,
      description: "Request submitted to Registrar Office. You will receive an SMS when approved.",
      variant: "info",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Breadcrumb
        title="Official Certificates & Academic Documents"
        subtitle="Digitally signed institutional documents, bonafide certificates, transcripts and fee ledgers"
      />

      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileBadge className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground text-sm">{doc.title}</h4>
                    <Badge variant={doc.type === "Financial" ? "accent" : "muted"} className="text-[10px]">
                      {doc.type}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{doc.session}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">Generated: {doc.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {doc.status === "Available" ? (
                  <button
                    onClick={() => handleDownloadDoc(doc)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Download className="size-3.5" />
                    <span>Download PDF</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestDoc(doc)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <Clock className="size-3.5 text-primary" />
                    <span>Submit Request</span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
