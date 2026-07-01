import { useState } from 'react';
import toast from 'react-hot-toast';

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatINR = (n) =>
  `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
};

const formatPeriodLabel = (filters = {}) => {
  const parts = [];
  if (filters.period) parts.push(`Period: ${filters.period}`);
  if (filters.startDate) parts.push(`From: ${formatDate(filters.startDate)}`);
  if (filters.endDate) parts.push(`To: ${formatDate(filters.endDate)}`);
  if (filters.doctorId) parts.push('Doctor filter active');
  if (filters.paymentMethod && filters.paymentMethod !== 'ALL')
    parts.push(`Payment: ${filters.paymentMethod}`);
  if (filters.appointmentStatus && filters.appointmentStatus !== 'ALL')
    parts.push(`Status: ${filters.appointmentStatus}`);
  return parts.length ? `Data for: ${parts.join(', ')}` : 'Data for: All time';
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useExportService(clinicId, filters, data)
 *
 * Provides `exportPDF` and `exportExcel` functions for downloading dashboard
 * reports. Both libraries (jspdf + xlsx) are loaded lazily via dynamic imports
 * so they don't inflate the initial bundle.
 *
 * Requirements: 6.1 – 6.21
 */
export function useExportService(clinicId, filters = {}, data = null) {
  const [exporting, setExporting] = useState(false);

  // ─── PDF Export ─────────────────────────────────────────────────────────────
  const exportPDF = async (clinicInfo = {}, chartRefs = []) => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const clinicName = clinicInfo?.name || 'PulseMate Clinic';
      const clinicAddress = clinicInfo?.address || '';
      const today = formatDate(new Date());

      // ── Header ──────────────────────────────────────────────────────────────
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text(clinicName, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      if (clinicAddress) doc.text(clinicAddress, 14, 28);
      doc.text(`Generated: ${today}`, 14, clinicAddress ? 34 : 28);
      doc.text(formatPeriodLabel(filters), 14, clinicAddress ? 40 : 34);

      let yPos = clinicAddress ? 50 : 44;

      const metrics = data?.metrics;
      const transactions = data?.transactions || [];
      const doctorPerformance = data?.doctorPerformance || [];

      // ── Metrics table ───────────────────────────────────────────────────────
      if (metrics) {
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text('Dashboard Metrics', 14, yPos);
        yPos += 4;

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: [
            ['Total Revenue', formatINR(metrics.revenue?.total)],
            ['Cash Revenue', formatINR(metrics.revenue?.cash)],
            ['Online Revenue', formatINR(metrics.revenue?.online)],
            ['Avg Revenue / Appointment', formatINR(metrics.revenue?.avgPerAppointment)],
            ['Total Patients', metrics.patients?.total ?? 0],
            ['New Patients', metrics.patients?.new ?? 0],
            ['Returning Patients', metrics.patients?.returning ?? 0],
            ['Total Appointments', metrics.appointments?.total ?? 0],
            ['Completed', metrics.appointments?.completed ?? 0],
            ['Cancelled', metrics.appointments?.cancelled ?? 0],
            ['No-Show', metrics.appointments?.noShow ?? 0],
            ['Completion Rate', `${metrics.appointments?.completionRate ?? 0}%`],
            ['Avg Wait Time', `${metrics.appointments?.avgWaitTime ?? 0} mins`],
            ['Active Staff', metrics.staff?.active ?? 0],
            ['Total Doctors', metrics.staff?.doctors ?? 0],
          ],
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 14, right: 14 },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ── Revenue by doctor ───────────────────────────────────────────────────
      if (doctorPerformance.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text('Revenue by Doctor', 14, yPos);
        yPos += 4;

        autoTable(doc, {
          startY: yPos,
          head: [['Doctor', 'Appointments', 'Revenue']],
          body: doctorPerformance.map((d) => [
            d.doctor,
            d.appointments,
            formatINR(d.revenue),
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 14, right: 14 },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ── Transactions table ──────────────────────────────────────────────────
      if (transactions.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text('Recent Transactions', 14, yPos);

        if (data?.truncated) {
          doc.setFontSize(9);
          doc.setTextColor(200, 100, 0);
          doc.text('* Limited to 1000 transactions', 14, yPos + 6);
          yPos += 8;
        }
        yPos += 4;

        const capped = transactions.slice(0, 1000);
        autoTable(doc, {
          startY: yPos,
          head: [['Patient', 'Doctor', 'Method', 'Amount', 'Date']],
          body: capped.map((t) => [
            t.patient?.name || '—',
            t.appointment?.doctor?.user?.name || '—',
            t.method || '—',
            formatINR(t.amount),
            formatDate(t.paidAt),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 14, right: 14 },
        });
      }

      // ── Chart images ────────────────────────────────────────────────────────
      if (chartRefs.length > 0) {
        const html2canvas = (await import('html2canvas')).default;
        for (const ref of chartRefs) {
          if (!ref?.current) continue;
          try {
            const canvas = await html2canvas(ref.current, { scale: 1.5 });
            const imgData = canvas.toDataURL('image/png');
            doc.addPage();
            const pageWidth = doc.internal.pageSize.getWidth();
            const imgWidth = pageWidth - 28;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            doc.addImage(imgData, 'PNG', 14, 14, imgWidth, imgHeight);
          } catch {
            // skip chart if capture fails
          }
        }
      }

      const filename = `pulsemate-dashboard-${clinicId}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('[exportPDF]', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ─── Excel Export ───────────────────────────────────────────────────────────
  const exportExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');

      const metrics = data?.metrics;
      const doctorPerformance = data?.doctorPerformance || [];
      const transactions = (data?.transactions || []).slice(0, 1000);

      // Sheet 1 — Summary
      const summaryRows = metrics
        ? [
            ['Metric', 'Value'],
            ['Generated', formatDate(new Date())],
            ['Filter', formatPeriodLabel(filters)],
            [],
            ['Total Revenue', formatINR(metrics.revenue?.total)],
            ['Cash Revenue', formatINR(metrics.revenue?.cash)],
            ['Online Revenue', formatINR(metrics.revenue?.online)],
            ['Avg Revenue / Appointment', formatINR(metrics.revenue?.avgPerAppointment)],
            ['Total Patients', metrics.patients?.total ?? 0],
            ['New Patients', metrics.patients?.new ?? 0],
            ['Returning Patients', metrics.patients?.returning ?? 0],
            ['Total Appointments', metrics.appointments?.total ?? 0],
            ['Completed', metrics.appointments?.completed ?? 0],
            ['Cancelled', metrics.appointments?.cancelled ?? 0],
            ['No-Show', metrics.appointments?.noShow ?? 0],
            ['Completion Rate', `${metrics.appointments?.completionRate ?? 0}%`],
            ['Avg Wait Time (mins)', metrics.appointments?.avgWaitTime ?? 0],
            ['Active Staff', metrics.staff?.active ?? 0],
            ['Total Doctors', metrics.staff?.doctors ?? 0],
          ]
        : [['No data available']];

      // Sheet 2 — Revenue by doctor
      const revenueRows = [
        ['Doctor', 'Appointments', 'Revenue'],
        ...doctorPerformance.map((d) => [d.doctor, d.appointments, formatINR(d.revenue)]),
      ];

      // Sheet 3 — Appointments
      const apptRows = metrics
        ? [
            ['Metric', 'Value'],
            ['Total', metrics.appointments?.total ?? 0],
            ['Completed', metrics.appointments?.completed ?? 0],
            ['Cancelled', metrics.appointments?.cancelled ?? 0],
            ['No-Show', metrics.appointments?.noShow ?? 0],
            ['Completion Rate', `${metrics.appointments?.completionRate ?? 0}%`],
            ['Avg Duration (mins)', metrics.appointments?.avgDuration ?? 0],
            ['Avg Wait Time (mins)', metrics.appointments?.avgWaitTime ?? 0],
            ['Peak Hour', metrics.appointments?.peakHour ?? '—'],
          ]
        : [['No data']];

      // Sheet 4 — Transactions
      const txRows = [
        ['Patient', 'Doctor', 'Method', 'Amount', 'Date'],
        ...transactions.map((t) => [
          t.patient?.name || '—',
          t.appointment?.doctor?.user?.name || '—',
          t.method || '—',
          formatINR(t.amount),
          formatDate(t.paidAt),
        ]),
      ];
      if (data?.truncated) {
        txRows.push([]);
        txRows.push(['* Data limited to 1000 transactions']);
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revenueRows), 'Revenue');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(apptRows), 'Appointments');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txRows), 'Transactions');

      const filename = `pulsemate-dashboard-${clinicId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('[exportExcel]', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportPDF, exportExcel };
}

export default useExportService;
