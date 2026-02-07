/**
 * PDF export utilities for Clarity Sheets
 * Uses client-side PDF generation (jsPDF or print API)
 */

export async function generatePDF(
  content: string,
  title: string,
  patientName: string,
  appointmentId: string,
  isPatientVersion: boolean = true
): Promise<void> {
  // Create a print-friendly HTML document
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page { margin: 20mm; }
            body { margin: 0; padding: 0; }
          }
          body {
            font-family: 'Roboto', Arial, sans-serif;
            color: #000;
            background: #fff;
            padding: 20mm;
            max-width: 210mm;
            margin: 0 auto;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #9333ea;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #9333ea;
            font-size: 24px;
            margin: 0 0 5px 0;
            font-weight: 600;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 12px;
          }
          .metadata {
            font-size: 11px;
            color: #666;
            margin-bottom: 20px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          .metadata p {
            margin: 5px 0;
          }
          h2 {
            color: #9333ea;
            font-size: 18px;
            margin: 25px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
          }
          h3 {
            color: #9333ea;
            font-size: 16px;
            margin: 20px 0 8px 0;
            font-weight: 600;
          }
          h4 {
            color: #9333ea;
            font-size: 14px;
            margin: 15px 0 6px 0;
            font-weight: 600;
          }
          p {
            margin: 8px 0;
            line-height: 1.6;
          }
          ul, ol {
            margin: 8px 0;
            padding-left: 25px;
          }
          li {
            margin: 4px 0;
            line-height: 1.5;
          }
          .content {
            line-height: 1.6;
          }
          .section {
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ZenLink</h1>
          <p>${title}</p>
        </div>
        <div class="metadata">
          <p><strong>Pacient:</strong> ${escapeHtml(patientName)}</p>
          <p><strong>Consultație ID:</strong> ${escapeHtml(appointmentId)}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
        </div>
        <div class="content">
          ${content}
        </div>
      </body>
    </html>
  `

  // Open print window
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Nu s-a putut deschide fereastra pentru PDF. Verifică dacă popup-urile sunt blocate.')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load, then trigger print
  setTimeout(() => {
    printWindow.print()
    // After printing, close the window
    setTimeout(() => {
      printWindow.close()
    }, 1000)
  }, 500)
}

export function formatSheetAsHTML(sheet: any, isPatient: boolean): string {
  let html = ''

  if (isPatient) {
    // NEW SIMPLE FORMAT - 6 sections
    html += `<div class="section"><h1>CLARITY SHEET</h1><p style="color: #666; font-size: 12px;">(Pe scurt, despre vizita ta)</p></div>`

    // Section 1: Ce s-a întâmplat azi
    html += `<div class="section"><h2>1. Ce s-a întâmplat azi</h2>`
    html += `<p><strong>Ai venit pentru că:</strong></p><ul>`
    if (sheet.whatHappenedToday) {
      html += `<li>${escapeHtml(sheet.whatHappenedToday)}</li>`
    }
    html += `</ul>`
    html += `<p><strong>Astăzi:</strong></p><ul>`
    if (sheet.todayActions?.length > 0) {
      sheet.todayActions.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
    }
    html += `</ul>`
    html += `<p style="color: #9333ea; font-size: 12px;">👉 Scopul a fost să înțelegem clar situația ta.</p></div>`

    // Section 2: Ce înseamnă asta pentru tine
    html += `<div class="section"><h2>2. Ce înseamnă asta pentru tine</h2>`
    html += `<p><strong>Din ce am văzut:</strong></p><ul>`
    if (sheet.whatThisMeans?.length > 0) {
      sheet.whatThisMeans.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
    }
    html += `</ul>`
    html += `<p style="color: #9333ea; font-size: 12px;">👉 Este suficient să știi ce se întâmplă, nu toate explicațiile tehnice.</p></div>`

    // Section 3: Ce urmează
    html += `<div class="section"><h2>3. Ce urmează</h2>`
    html += `<p><strong>Următorii pași sunt simpli:</strong></p><ul>`
    if (sheet.nextSteps?.length > 0) {
      sheet.nextSteps.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
    }
    html += `</ul>`
    if (sheet.nextAppointment) {
      html += `<p>📅 Următoarea întâlnire: ${escapeHtml(sheet.nextAppointment)}</p>`
    }
    html += `</div>`

    // Section 4: La ce să fii atent
    html += `<div class="section"><h2>4. La ce să fii atent</h2>`
    html += `<p><strong>Până data viitoare, notează dacă observi:</strong></p><ul>`
    if (sheet.whatToWatchFor?.length > 0) {
      sheet.whatToWatchFor.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
    }
    html += `</ul>`
    html += `<p>📞 Dacă apare ceva neobișnuit pentru tine, contactează clinica.</p></div>`

    // Section 5: Verificare rapidă (pentru tine)
    html += `<div class="section"><h2>5. Verificare rapidă (pentru tine)</h2>`
    html += `<p><strong>Ia un moment și gândește-te:</strong></p><ul>`
    if (sheet.quickCheckQuestions?.length > 0) {
      sheet.quickCheckQuestions.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
    }
    html += `</ul>`
    html += `<p style="font-style: italic; color: #666; font-size: 11px;">Dacă nu ai un răspuns clar, e în regulă — îl vom clarifica împreună.</p></div>`

    // Section 6: Un lucru important
    html += `<div class="section"><h2>6. Un lucru important</h2>`
    html += `<p><strong>Acest document:</strong></p><ul>`
    if (sheet.importantNote?.length > 0) {
      sheet.importantNote.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
    }
    html += `</ul>`
    html += `<p>Medicul tău este cel care te ghidează mai departe.</p></div>`
  } else {
    // DOCTOR SUMMARY - OLD FORMAT (9 sections)
    // Section 1: Date generale caz
    if (sheet.consultationDate || sheet.clinician || sheet.specialty || sheet.presentationType) {
      html += `<div class="section"><h2>1. Date generale caz</h2>`
      if (sheet.consultationDate) html += `<p><strong>Data consultației:</strong> ${escapeHtml(sheet.consultationDate)}</p>`
      if (sheet.clinician) html += `<p><strong>Clinician:</strong> ${escapeHtml(sheet.clinician)}</p>`
      if (sheet.specialty) html += `<p><strong>Specialitate:</strong> ${escapeHtml(sheet.specialty)}</p>`
      if (sheet.presentationType) html += `<p><strong>Tip prezentare:</strong> ${escapeHtml(sheet.presentationType)}</p>`
      html += `</div>`
    }

    // Section 2: Motivul prezentării
    if (sheet.chiefComplaint && sheet.includeChiefComplaint) {
      html += `<div class="section"><h2>2. Motivul prezentării (raportat de pacient)</h2>`
      html += `<p style="font-style: italic;">„Pacientul se prezintă pentru…”</p>`
      html += `<p>${escapeHtml(sheet.chiefComplaint)}</p></div>`
    }

    // Section 3: Anamneză relevantă
    if ((sheet.generalMedicalHistory?.length > 0) || (sheet.dentalHistory?.length > 0)) {
      html += `<div class="section"><h2>3. Anamneză relevantă (structurată)</h2>`
      if (sheet.generalMedicalHistory?.length > 0) {
        html += `<h3>Istoric medical general (relevant)</h3><ul>`
        sheet.generalMedicalHistory.forEach((item: string) => {
          html += `<li>${escapeHtml(item)}</li>`
        })
        html += `</ul>`
      }
      if (sheet.dentalHistory?.length > 0) {
        html += `<h3>Istoric dentar (afecțiuni heredocolaterale stomatologice)</h3><ul>`
        sheet.dentalHistory.forEach((item: string) => {
          html += `<li>${escapeHtml(item)}</li>`
        })
        html += `</ul>`
      }
      html += `</div>`
    }

    // Section 4: Observații clinice
    if ((sheet.generalObservations?.length > 0) || (sheet.specialtySpecificObservations?.length > 0)) {
      html += `<div class="section"><h2>4. Observații clinice (examen obiectiv)</h2>`
      if (sheet.generalObservations?.length > 0 && sheet.includeObservationsSummary) {
        html += `<h3>Observații generale</h3><ul>`
        sheet.generalObservations.forEach((item: string) => {
          html += `<li>${escapeHtml(item)}</li>`
        })
        html += `</ul>`
      }
      if (sheet.specialtySpecificObservations?.length > 0 && sheet.includeObservationsSummary) {
        html += `<h3>Observații specifice specialității</h3><ul>`
        sheet.specialtySpecificObservations.forEach((item: string) => {
          html += `<li>${escapeHtml(item)}</li>`
        })
        html += `</ul>`
      }
      html += `</div>`
    }

    // Section 5: Date suplimentare & materiale
    if ((sheet.availableInvestigations?.length > 0) || (sheet.clinicalPhotos?.length > 0) || (sheet.otherDocuments?.length > 0)) {
      html += `<div class="section"><h2>5. Date suplimentare & materiale</h2>`
      if (sheet.availableInvestigations?.length > 0) {
        html += `<h4>investigații disponibile</h4><ul>`
        sheet.availableInvestigations.forEach((item: string) => {
          html += `<li>${escapeHtml(item)}</li>`
        })
        html += `</ul>`
      }
      if (sheet.clinicalPhotos?.length > 0) {
        html += `<h4>fotografii clinice</h4><ul>`
        sheet.clinicalPhotos.forEach((item: string) => {
          html += `<li>${escapeHtml(item)}</li>`
        })
        html += `</ul>`
      }
      if (sheet.otherDocuments?.length > 0) {
        html += `<h4>alte documente încărcate</h4><ul>`
        sheet.otherDocuments.forEach((item: string) => {
          html += `<li>${escapeHtml(item)}</li>`
        })
        html += `</ul>`
      }
      html += `</div>`
    }

    // Section 6: Notă clinică - EXCLUDED if excludeClinicianNote is true
    if (sheet.clinicianNote && !sheet.excludeClinicianNote) {
      html += `<div class="section"><h2>6. Notă clinică – clinician (uman)</h2>`
      html += `<p>${escapeHtml(sheet.clinicianNote)}</p></div>`
    }

    // Section 7: Acțiuni realizate
    if (sheet.actionsPerformed?.length > 0 && sheet.includeActionsPerformed) {
      html += `<div class="section"><h2>7. Acțiuni realizate în cadrul consultației</h2><ul>`
      sheet.actionsPerformed.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
      html += `</ul></div>`
    }

    // Section 8: Claritate & proveniența informației
    if (sheet.informationSources?.length > 0) {
      html += `<div class="section"><h2>8. Claritate & proveniența informației</h2>`
      html += `<p><strong>Originea informațiilor din acest document</strong></p><ul>`
      sheet.informationSources.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
      html += `</ul></div>`
    }

    // Section 9: Control export
    html += `<div class="section" style="background: #f3f4f6; padding: 10px; border-left: 4px solid #9333ea; margin-top: 20px;">
      <h4>9. Control export către pacient</h4>
      <p style="font-size: 11px; margin: 5px 0;">☑️ Include: motivul prezentării, rezumat observații, acțiuni realizate, pași următori</p>
      <p style="font-size: 11px; margin: 5px 0;">☐ Exclude: notă clinică internă, observații sensibile</p>
    </div>`
  }

  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
