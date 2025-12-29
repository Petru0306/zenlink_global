package com.zenlink.zenlink.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfTextExtractor {

    /**
     * Returns per-page extracted text. For scanned PDFs this will likely be empty/low-quality.
     */
    public List<String> extractPages(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) return List.of();
        try (ByteArrayInputStream in = new ByteArrayInputStream(pdfBytes);
             PDDocument doc = org.apache.pdfbox.Loader.loadPDF(in.readAllBytes())) {
            int pages = doc.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();

            List<String> out = new ArrayList<>(Math.max(0, pages));
            for (int i = 1; i <= pages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String text = stripper.getText(doc);
                out.add(text == null ? "" : text);
            }

            return out;
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract PDF text: " + e.getMessage(), e);
        }
    }

    public static boolean looksScanned(List<String> pages) {
        if (pages == null || pages.isEmpty()) return true;
        int nonEmpty = 0;
        int totalChars = 0;
        for (String p : pages) {
            if (p == null) continue;
            String t = p.trim();
            if (!t.isEmpty()) nonEmpty++;
            totalChars += t.length();
        }
        // Heuristic: very low text usually means scanned
        return nonEmpty == 0 || totalChars < 200;
    }
}


