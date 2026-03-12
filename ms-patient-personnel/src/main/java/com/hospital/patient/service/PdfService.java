package com.hospital.patient.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.hospital.patient.entity.*;
import com.hospital.patient.exception.PatientNotFoundException;
import com.hospital.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfService {

    private final PatientRepository patientRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // Colors
    private static final Color PRIMARY   = new Color(37, 99, 235);   // blue-600
    private static final Color SUCCESS   = new Color(5, 150, 105);   // green-600
    private static final Color LIGHT_BG  = new Color(248, 250, 252);
    private static final Color BORDER_C  = new Color(226, 232, 240);
    private static final Color GRAY_TEXT = new Color(100, 116, 139);

    @Transactional(readOnly = true)
    public byte[] generateDossierPdf(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));

        DossierMedical dossier = patient.getDossierMedical();
        if (dossier == null) throw new PatientNotFoundException("Dossier médical non trouvé");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 60, 50);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new HeaderFooterEvent(patient));
            document.open();

            addHeader(document, patient, dossier);
            addPatientInfo(document, patient);

            if (!dossier.getAntecedents().isEmpty())
                addAntecedents(document, dossier.getAntecedents());

            if (!dossier.getConsultations().isEmpty())
                addConsultations(document, dossier.getConsultations());

            if (!dossier.getOrdonnances().isEmpty())
                addOrdonnances(document, dossier.getOrdonnances());

            if (!dossier.getAnalyses().isEmpty())
                addAnalyses(document, dossier.getAnalyses());

            if (!dossier.getRadiologies().isEmpty())
                addRadiologies(document, dossier.getRadiologies());

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération PDF dossier patient {}: {}", patientId, e.getMessage());
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }

    // ─── Sections ─────────────────────────────────────────────────────────────

    private void addHeader(Document doc, Patient patient, DossierMedical dossier) throws Exception {
        Font titleFont = new Font(Font.HELVETICA, 22, Font.BOLD, PRIMARY);
        Font subFont   = new Font(Font.HELVETICA, 11, Font.NORMAL, GRAY_TEXT);

        Paragraph title = new Paragraph("DOSSIER MÉDICAL", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);

        Paragraph sub = new Paragraph("N° " + dossier.getNumeroDossier() +
                " — Généré le " + java.time.LocalDate.now().format(DATE_FMT), subFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(20);
        doc.add(sub);

        addLineSeparator(doc);
    }

    private void addPatientInfo(Document doc, Patient patient) throws Exception {
        addSectionTitle(doc, "INFORMATIONS PATIENT");

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingAfter(14);

        addInfoCell(table, "Nom complet", patient.getPrenom() + " " + patient.getNom());
        addInfoCell(table, "CIN", patient.getCin());
        addInfoCell(table, "Date de naissance",
                patient.getDateNaissance() != null ? patient.getDateNaissance().format(DATE_FMT) : "—");
        addInfoCell(table, "Sexe", patient.getSexe() != null ? patient.getSexe().name() : "—");
        addInfoCell(table, "Groupe sanguin",
                patient.getGroupeSanguin() != null ? patient.getGroupeSanguin().name().replace('_', ' ') : "—");
        addInfoCell(table, "Téléphone", patient.getTelephone() != null ? patient.getTelephone() : "—");
        addInfoCell(table, "Email", patient.getEmail() != null ? patient.getEmail() : "—");
        addInfoCell(table, "Mutuelle", patient.getMutuelle() != null ? patient.getMutuelle() : "—");
        doc.add(table);
    }

    private void addAntecedents(Document doc, List<Antecedent> items) throws Exception {
        addSectionTitle(doc, "ANTÉCÉDENTS MÉDICAUX");
        PdfPTable table = new PdfPTable(new float[]{2f, 5f, 2f, 2f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(14);
        addTableHeader(table, "Type", "Description", "Date diagnostic", "Sévérité");
        for (Antecedent a : items) {
            addTableRow(table,
                a.getTypeAntecedent() != null ? a.getTypeAntecedent().name() : "—",
                a.getDescription() != null ? a.getDescription() : "—",
                a.getDateDiagnostic() != null ? a.getDateDiagnostic().format(DATE_FMT) : "—",
                a.getSeverite() != null ? a.getSeverite().name() : "—"
            );
        }
        doc.add(table);
    }

    private void addConsultations(Document doc, List<Consultation> items) throws Exception {
        addSectionTitle(doc, "CONSULTATIONS");
        for (Consultation c : items) {
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingAfter(8);
            Color bg = new Color(240, 249, 255);
            table.getDefaultCell().setBackgroundColor(bg);
            table.getDefaultCell().setBorderColor(new Color(186, 230, 253));

            Font hdr = new Font(Font.HELVETICA, 10, Font.BOLD, PRIMARY);
            PdfPCell dateCell = new PdfPCell(new Phrase(
                c.getDateConsultation() != null ? c.getDateConsultation().format(DATETIME_FMT) : "—", hdr));
            dateCell.setColspan(2);
            dateCell.setBackgroundColor(new Color(219, 234, 254));
            dateCell.setBorderColor(BORDER_C);
            dateCell.setPadding(6);
            table.addCell(dateCell);

            if (c.getMedecin() != null)
                addConsultCell(table, "Médecin", c.getMedecin().getNomComplet());
            if (c.getMotif() != null)
                addConsultCell(table, "Motif", c.getMotif());
            if (c.getDiagnostic() != null)
                addConsultCell(table, "Diagnostic", c.getDiagnostic());
            if (c.getTraitement() != null)
                addConsultCell(table, "Traitement", c.getTraitement());

            doc.add(table);
        }
    }

    private void addOrdonnances(Document doc, List<Ordonnance> items) throws Exception {
        addSectionTitle(doc, "ORDONNANCES");
        for (Ordonnance o : items) {
            Font hdr = new Font(Font.HELVETICA, 10, Font.BOLD, SUCCESS);
            Paragraph p = new Paragraph(
                (o.getDateOrdonnance() != null ? o.getDateOrdonnance().format(DATE_FMT) : "—") +
                (o.getTypeOrdonnance() != null ? " — " + o.getTypeOrdonnance().name() : ""), hdr);
            p.setSpacingBefore(4);
            doc.add(p);

            if (o.getLignes() != null) {
                for (LigneOrdonnance l : o.getLignes()) {
                    Font mFont = new Font(Font.HELVETICA, 9, Font.NORMAL);
                    String line = "  • " + (l.getMedicament() != null ? l.getMedicament() : "—");
                    if (l.getDosage() != null) line += " — " + l.getDosage();
                    if (l.getDureeJours() != null) line += " — " + l.getDureeJours() + " jours";
                    doc.add(new Paragraph(line, mFont));
                }
            }
        }
        doc.add(new Paragraph(" "));
    }

    private void addAnalyses(Document doc, List<AnalyseLaboratoire> items) throws Exception {
        addSectionTitle(doc, "ANALYSES DE LABORATOIRE");
        PdfPTable table = new PdfPTable(new float[]{2.5f, 2f, 4f, 2f, 2f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(14);
        addTableHeader(table, "Type", "Date", "Résultats", "Labo", "Statut");
        for (AnalyseLaboratoire a : items) {
            addTableRow(table,
                a.getTypeAnalyse() != null ? a.getTypeAnalyse() : "—",
                a.getDateAnalyse() != null ? a.getDateAnalyse().format(DATE_FMT) : "—",
                a.getResultats() != null ? a.getResultats() : "—",
                a.getLaboratoire() != null ? a.getLaboratoire() : "—",
                a.getStatut() != null ? a.getStatut().name() : "—"
            );
        }
        doc.add(table);
    }

    private void addRadiologies(Document doc, List<Radiologie> items) throws Exception {
        addSectionTitle(doc, "RADIOLOGIES");
        PdfPTable table = new PdfPTable(new float[]{2f, 2f, 4f, 4f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(14);
        addTableHeader(table, "Type", "Date", "Description", "Conclusion");
        for (Radiologie r : items) {
            addTableRow(table,
                r.getTypeExamen() != null ? r.getTypeExamen().name() : "—",
                r.getDateExamen() != null ? r.getDateExamen().format(DATE_FMT) : "—",
                r.getDescription() != null ? r.getDescription() : "—",
                r.getConclusion() != null ? r.getConclusion() : "—"
            );
        }
        doc.add(table);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void addSectionTitle(Document doc, String title) throws Exception {
        Font f = new Font(Font.HELVETICA, 13, Font.BOLD, PRIMARY);
        Paragraph p = new Paragraph(title, f);
        p.setSpacingBefore(16);
        p.setSpacingAfter(6);
        doc.add(p);
        addLineSeparator(doc);
    }

    private void addLineSeparator(Document doc) throws Exception {
        LineSeparator ls = new LineSeparator(1f, 100f, BORDER_C, Element.ALIGN_CENTER, -2);
        doc.add(new Chunk(ls));
        doc.add(Chunk.NEWLINE);
    }

    private void addInfoCell(PdfPTable table, String label, String value) {
        Font labelFont = new Font(Font.HELVETICA, 8, Font.NORMAL, GRAY_TEXT);
        Font valueFont = new Font(Font.HELVETICA, 10, Font.BOLD);

        PdfPCell cell = new PdfPCell();
        cell.addElement(new Phrase(label, labelFont));
        cell.addElement(new Phrase(value, valueFont));
        cell.setBorderColor(BORDER_C);
        cell.setBackgroundColor(LIGHT_BG);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        Font f = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, f));
            cell.setBackgroundColor(PRIMARY);
            cell.setPadding(5);
            cell.setBorderColor(PRIMARY);
            table.addCell(cell);
        }
    }

    private void addTableRow(PdfPTable table, String... values) {
        Font f = new Font(Font.HELVETICA, 9);
        for (String v : values) {
            PdfPCell cell = new PdfPCell(new Phrase(v, f));
            cell.setPadding(4);
            cell.setBorderColor(BORDER_C);
            table.addCell(cell);
        }
    }

    private void addConsultCell(PdfPTable table, String label, String value) {
        Font labelFont = new Font(Font.HELVETICA, 8, Font.BOLD, GRAY_TEXT);
        Font valueFont = new Font(Font.HELVETICA, 9);
        PdfPCell lCell = new PdfPCell(new Phrase(label, labelFont));
        lCell.setPadding(4); lCell.setBorderColor(BORDER_C);
        PdfPCell vCell = new PdfPCell(new Phrase(value, valueFont));
        vCell.setPadding(4); vCell.setBorderColor(BORDER_C);
        table.addCell(lCell);
        table.addCell(vCell);
    }

    // ─── Header / Footer ──────────────────────────────────────────────────────

    private static class HeaderFooterEvent extends PdfPageEventHelper {
        private final Patient patient;
        HeaderFooterEvent(Patient patient) { this.patient = patient; }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            Font small = new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(148, 163, 184));

            // Footer
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                new Phrase("MedSys Hospital System — " + patient.getPrenom() + " " + patient.getNom()
                    + " — Page " + writer.getPageNumber(), small),
                document.left() + (document.right() - document.left()) / 2,
                document.bottom() - 20, 0);
        }
    }
}
