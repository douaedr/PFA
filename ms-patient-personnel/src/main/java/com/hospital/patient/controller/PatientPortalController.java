package com.hospital.patient.controller;

import com.google.zxing.WriterException;
import com.hospital.patient.dto.*;
import com.hospital.patient.entity.DocumentPatient;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.exception.PatientNotFoundException;
import com.hospital.patient.mapper.PatientMapper;
import com.hospital.patient.repository.PatientRepository;
import com.hospital.patient.security.JwtService;
import com.hospital.patient.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/patient")
@RequiredArgsConstructor
public class PatientPortalController {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final JwtService jwtService;
    private final PatientService patientService;
    private final DocumentService documentService;
    private final MessageService messageService;
    private final QrCodeService qrCodeService;
    private final PdfService pdfService;
    private final RdvProxyService rdvProxyService;

    // ─── Profil ───────────────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<PatientResponseDTO> getMyProfile(
            @RequestHeader("Authorization") String authHeader) {
        Long patientId = extractPatientId(authHeader);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));
        return ResponseEntity.ok(patientMapper.toResponseDTO(patient));
    }

    @PatchMapping("/me")
    public ResponseEntity<PatientResponseDTO> updateMyProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfilRequest req) {
        Long patientId = extractPatientId(authHeader);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));

        if (req.getTelephone() != null) patient.setTelephone(req.getTelephone());
        if (req.getEmail()     != null) patient.setEmail(req.getEmail());
        if (req.getAdresse()   != null) patient.setAdresse(req.getAdresse());
        if (req.getVille()     != null) patient.setVille(req.getVille());
        if (req.getMutuelle()  != null) patient.setMutuelle(req.getMutuelle());
        if (req.getNumeroCNSS() != null) patient.setNumeroCNSS(req.getNumeroCNSS());

        return ResponseEntity.ok(patientMapper.toResponseDTO(patientRepository.save(patient)));
    }

    // ─── Dossier ──────────────────────────────────────────────────────────────

    @GetMapping("/me/dossier")
    public ResponseEntity<DossierMedicalDTO> getMyDossier(
            @RequestHeader("Authorization") String authHeader) {
        Long patientId = extractPatientId(authHeader);
        return ResponseEntity.ok(patientService.getDossierMedical(patientId));
    }

    // ─── PDF Export ───────────────────────────────────────────────────────────

    @GetMapping("/me/dossier/pdf")
    public ResponseEntity<byte[]> exportDossierPdf(
            @RequestHeader("Authorization") String authHeader) {
        Long patientId = extractPatientId(authHeader);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));

        byte[] pdf = pdfService.generateDossierPdf(patientId);
        String filename = "dossier-" + patient.getCin() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    // ─── QR Code ──────────────────────────────────────────────────────────────

    @GetMapping("/me/qrcode")
    public ResponseEntity<byte[]> getMyQrCode(
            @RequestHeader("Authorization") String authHeader) {
        Long patientId = extractPatientId(authHeader);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException("Patient non trouvé"));

        try {
            byte[] qr = qrCodeService.generatePatientQrCode(patient);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(qr);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ─── Notifications ────────────────────────────────────────────────────────

    @GetMapping("/me/notifications")
    public ResponseEntity<Map<String, Long>> getNotifications(
            @RequestHeader("Authorization") String authHeader) {
        Long patientId = extractPatientId(authHeader);

        DossierMedicalDTO dossier;
        long analysesEnAttente = 0;
        try {
            dossier = patientService.getDossierMedical(patientId);
            analysesEnAttente = dossier.getAnalyses() != null
                ? dossier.getAnalyses().stream().filter(a -> "EN_ATTENTE".equals(a.getStatut())).count()
                : 0;
        } catch (Exception ignored) {}

        long messagesNonLus = messageService.countUnreadFromMedecin(patientId);

        return ResponseEntity.ok(Map.of(
                "analysesEnAttente", analysesEnAttente,
                "messagesNonLus", messagesNonLus,
                "total", analysesEnAttente + messagesNonLus
        ));
    }

    // ─── Documents ────────────────────────────────────────────────────────────

    @PostMapping(value = "/me/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("fichier") MultipartFile fichier,
            @RequestParam("type") String type,
            @RequestParam(value = "description", required = false, defaultValue = "") String description) {

        if (fichier.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "Le fichier est vide"));
        if (fichier.getSize() > 10 * 1024 * 1024)
            return ResponseEntity.badRequest().body(Map.of("message", "Fichier trop volumineux (max 10 MB)"));

        try {
            Long patientId = extractPatientId(authHeader);
            DocumentPatientDTO dto = documentService.uploadDocument(patientId, fichier, type, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de l'enregistrement du fichier"));
        }
    }

    @GetMapping("/me/documents")
    public ResponseEntity<List<DocumentPatientDTO>> getMyDocuments(
            @RequestHeader("Authorization") String authHeader) {
        Long patientId = extractPatientId(authHeader);
        return ResponseEntity.ok(documentService.getDocuments(patientId));
    }

    @GetMapping("/me/documents/{id}/fichier")
    public ResponseEntity<Resource> getDocumentFile(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            Long patientId = extractPatientId(authHeader);
            DocumentPatient doc = documentService.getDocumentForPatient(id, patientId);
            Resource resource = documentService.loadFileAsResource(doc.getCheminFichier());
            String contentType = doc.getContentType() != null ? doc.getContentType() : "application/octet-stream";
            String disposition = contentType.startsWith("image/") ? "inline" : "attachment";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            disposition + "; filename=\"" + doc.getNomFichierOriginal() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/me/documents/{id}")
    public ResponseEntity<?> deleteDocument(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            Long patientId = extractPatientId(authHeader);
            documentService.deleteDocument(id, patientId);
            return ResponseEntity.ok(Map.of("message", "Document supprimé avec succès"));
        } catch (PatientNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la suppression"));
        }
    }

    // ─── Messagerie ───────────────────────────────────────────────────────────

    @GetMapping("/me/messages")
    public ResponseEntity<List<MessagePatientDTO>> getMessages(
            @RequestHeader("Authorization") String authHeader) {
        Long patientId = extractPatientId(authHeader);
        return ResponseEntity.ok(messageService.getMessages(patientId));
    }

    @PostMapping("/me/messages")
    public ResponseEntity<MessagePatientDTO> envoyerMessage(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody EnvoyerMessageRequest req) {
        Long patientId = extractPatientId(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.envoyerMessage(patientId, req));
    }

    @PutMapping("/me/messages/{id}/lu")
    public ResponseEntity<?> marquerLu(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        Long patientId = extractPatientId(authHeader);
        messageService.marquerLu(patientId, id);
        return ResponseEntity.ok(Map.of("message", "Message marqué comme lu"));
    }

    // ─── Rendez-vous ──────────────────────────────────────────────────────────

    @GetMapping("/me/rdv")
    public ResponseEntity<List<RendezVousDTO>> getMyRdv(
            @RequestHeader("Authorization") String authHeader) {
        Long patientId = extractPatientId(authHeader);
        return ResponseEntity.ok(rdvProxyService.getRdvPatient(patientId));
    }

    @PutMapping("/me/rdv/{id}/annuler")
    public ResponseEntity<?> annulerRdv(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        Long patientId = extractPatientId(authHeader);
        boolean ok = rdvProxyService.annulerRdv(id, patientId);
        if (ok) return ResponseEntity.ok(Map.of("message", "Rendez-vous annulé"));
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", "Service rendez-vous indisponible"));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Long extractPatientId(String authHeader) {
        String token = authHeader.substring(7);
        Long patientId = jwtService.extractPatientId(token);
        if (patientId == null) throw new PatientNotFoundException("Token invalide");
        return patientId;
    }
}
