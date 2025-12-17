package com.zenlink.zenlink.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RagChunker {

    public record Chunk(int pageNumber, int chunkIndex, String text) {}

    /**
     * Simple per-page chunking by characters with overlap.
     */
    public List<Chunk> chunkPages(List<String> pages, int chunkSizeChars, int overlapChars) {
        List<Chunk> out = new ArrayList<>();
        if (pages == null || pages.isEmpty()) return out;

        int cs = Math.max(200, chunkSizeChars);
        int ov = Math.max(0, Math.min(overlapChars, cs - 50));

        for (int p = 0; p < pages.size(); p++) {
            String raw = pages.get(p);
            String t = raw == null ? "" : raw.trim();
            if (t.isEmpty()) continue;

            int idx = 0;
            int chunkIndex = 0;
            while (idx < t.length()) {
                int end = Math.min(t.length(), idx + cs);
                String part = t.substring(idx, end).trim();
                if (!part.isEmpty()) {
                    out.add(new Chunk(p + 1, chunkIndex++, part));
                }
                if (end >= t.length()) break;
                idx = Math.max(0, end - ov);
            }
        }

        return out;
    }
}


