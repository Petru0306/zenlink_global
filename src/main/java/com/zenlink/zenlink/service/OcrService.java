package com.zenlink.zenlink.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class OcrService {

    /**
     * Runs OCRmyPDF with a sidecar text output (RO+EN). Returns the sidecar text.
     * This does NOT store the OCR'd PDF; it only extracts text (per your requirement).
     */
    public String ocrToText(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) return "";

        try {
            Path tmpDir = Files.createTempDirectory("zenlink-ocr-");
            Path inPdf = tmpDir.resolve("input.pdf");
            Path outPdf = tmpDir.resolve("output.pdf");
            Path sidecar = tmpDir.resolve("sidecar.txt");

            Files.write(inPdf, pdfBytes);

            ProcessBuilder pb = new ProcessBuilder(
                    "ocrmypdf",
                    "--force-ocr",
                    "-l", "ron+eng",
                    "--sidecar", sidecar.toString(),
                    inPdf.toString(),
                    outPdf.toString()
            );
            pb.redirectErrorStream(true);

            Process p = pb.start();
            String output = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            int code = p.waitFor();
            if (code != 0) {
                throw new RuntimeException("OCR failed (exit " + code + "): " + output);
            }

            String text = Files.exists(sidecar) ? Files.readString(sidecar, StandardCharsets.UTF_8) : "";

            // Best-effort cleanup
            try {
                Files.deleteIfExists(inPdf);
                Files.deleteIfExists(outPdf);
                Files.deleteIfExists(sidecar);
                Files.deleteIfExists(tmpDir);
            } catch (Exception ignored) {}

            return text;
        } catch (IOException e) {
            throw new RuntimeException("OCR tool not available or failed to run (is ocrmypdf installed?): " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("OCR interrupted");
        }
    }
}


