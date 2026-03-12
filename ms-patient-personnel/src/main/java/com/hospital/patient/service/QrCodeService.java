package com.hospital.patient.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.hospital.patient.entity.Patient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class QrCodeService {

    public byte[] generatePatientQrCode(Patient patient) throws WriterException, IOException {
        String content = buildQrContent(patient);

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 2);

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, 300, 300, hints);

        BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        return baos.toByteArray();
    }

    private String buildQrContent(Patient patient) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== MEDSYS – DOSSIER MÉDICAL ===\n");
        sb.append("Nom: ").append(patient.getPrenom()).append(" ").append(patient.getNom()).append("\n");
        sb.append("CIN: ").append(patient.getCin()).append("\n");
        if (patient.getDateNaissance() != null)
            sb.append("Né(e) le: ").append(patient.getDateNaissance()).append("\n");
        if (patient.getGroupeSanguin() != null)
            sb.append("Groupe sanguin: ").append(patient.getGroupeSanguin().name().replace('_', ' ')).append("\n");
        if (patient.getDossierMedical() != null)
            sb.append("N° Dossier: ").append(patient.getDossierMedical().getNumeroDossier()).append("\n");
        if (patient.getTelephone() != null)
            sb.append("Tel: ").append(patient.getTelephone()).append("\n");
        sb.append("Généré par MedSys Hospital System");
        return sb.toString();
    }
}
