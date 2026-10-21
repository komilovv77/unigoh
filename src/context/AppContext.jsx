import React, { createContext, useContext, useState, useEffect } from 'react';
import { UNIVERSITIES } from '../data/universities';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Current active navigation tab: 'catalog' | 'profile' | 'applications' | 'crm' | 'founder'
  const [currentTab, setCurrentTab] = useState('catalog');
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Security & Role-Based Access Control (RBAC)
  // 'student' (default for public) | 'university_admin' | 'master_admin'
  const [userRole, setUserRole] = useState('student');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [targetAdminTab, setTargetAdminTab] = useState(null);

  // Student Profile State (Abituriyent)
  const [studentProfile, setStudentProfile] = useState(() => {
    const saved = localStorage.getItem('unigoh_student_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      fullName: "Abdulloh Komilov",
      phone: "+998 90 123 45 67",
      jshshir: "31405026280019", // 14-digit Uzbek PINFL
      region: "Andijon",
      city: "Andijon shahri",
      birthDate: "2006-05-14",
      targetMajor: "IT va Sun'iy intellekt",
      passportDocument: {
        fileName: "passport_komilov_a.pdf",
        uploadedAt: "2026-05-10",
        fileSize: "1.4 MB",
        isOcrVerified: true,
        ocrConfidence: "99.4%",
        extractedName: "KOMILOV ABDULLOH",
        extractedPinfl: "31405026280019"
      },
      diplomaDocument: {
        fileName: "attestat_maktab_24.jpg",
        uploadedAt: "2026-05-12",
        fileSize: "2.1 MB",
        isOcrVerified: true,
        ocrConfidence: "98.8%",
        extractedGpa: "4.8 / 5.0"
      },
      // Til va Xalqaro Sertifikatlar (CEFR, IELTS, TOEFL, Duolingo, TOPIK, SAT va b.)
      certificates: [
        {
          id: "cert-1",
          type: "CEFR (Milliy Sertifikat)",
          level: "B2 (72 ball)",
          issueDate: "2025-11-20",
          certificateNumber: "UZ-CEFR-849102",
          fileName: "cefr_b2_komilov.pdf",
          isVerified: true
        },
        {
          id: "cert-2",
          type: "IELTS Academic",
          level: "Band 6.5 (R: 7.0, L: 6.5, W: 6.0, S: 6.5)",
          issueDate: "2026-02-15",
          certificateNumber: "26UZ008412KOMA",
          fileName: "ielts_6_5_komilov.pdf",
          isVerified: true
        }
      ],
      // Davlat Test Markazi (DTM) va OTM Natijalari
      testScores: {
        dtmExamScore: "142.8",
        dtmMaxScore: "189.0",
        dtmYear: "2026",
        dtmSheetFile: "dtm_javoblar_varaqasi_2026.pdf",
        internalUniScore: "92 ball (Imtihondan o'tgan)",
        isVerified: true
      }
    };
  });

  // Submitted Applications
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('unigoh_applications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: "UNIGOH-2026-ISFT-0894",
        universityId: "isft-andijan",
        universityName: "ISFT Institute (Andijon Filiali)",
        programId: "isft-it",
        programName: "Dasturiy injiniring va Sun'iy intellekt",
        degree: "Bakalavr",
        submittedAt: "2026-05-15 14:32",
        status: "IN_REVIEW", // PENDING | IN_REVIEW | EXAM_SCHEDULED | APPROVED | CONTRACT_ISSUED | REJECTED
        examDate: "2026-06-10, 10:00 (Offline)",
        grantApplied: true,
        applicantName: "Abdulloh Komilov",
        applicantPhone: "+998 90 123 45 67",
        applicantPinfl: "31405026280019",
        region: "Andijon",
        notes: "Iqtidorli abituriyent, 100% rektor grantiga nomzod"
      },
      {
        id: "UNIGOH-2026-KU-0142",
        universityId: "kokand-uni",
        universityName: "Qo'qon Universiteti",
        programId: "ku-it",
        programName: "Axborot tizimlari va texnologiyalari",
        degree: "Bakalavr",
        submittedAt: "2026-05-18 09:15",
        status: "APPROVED",
        examDate: "Imtihondan muvaffaqiyatli o'tdi (92 ball)",
        grantApplied: true,
        applicantName: "Abdulloh Komilov",
        applicantPhone: "+998 90 123 45 67",
        applicantPinfl: "31405026280019",
        region: "Farg'ona",
        notes: "50% grant taqdim etildi"
      }
    ];
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('unigoh_student_profile', JSON.stringify(studentProfile));
  }, [studentProfile]);

  useEffect(() => {
    localStorage.setItem('unigoh_applications', JSON.stringify(applications));
  }, [applications]);

  // Show a toast notification
  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Submit Application
  const submitApplication = (university, program) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const appId = `UNIGOH-2026-${university.code}-${randomNum}`;

    const newApp = {
      id: appId,
      universityId: university.id,
      universityName: university.name,
      programId: program.id,
      programName: program.name,
      degree: program.degree || "Bakalavr",
      submittedAt: new Date().toLocaleString('uz-UZ'),
      status: "PENDING",
      examDate: "Tez orada belgilanadi",
      grantApplied: true,
      applicantName: studentProfile.fullName,
      applicantPhone: studentProfile.phone,
      applicantPinfl: studentProfile.jshshir,
      region: studentProfile.region,
      notes: "UniGoh orqali yuborilgan ariza"
    };

    setApplications(prev => [newApp, ...prev]);
    setIsApplyModalOpen(false);
    notify(`Arizangiz muvaffaqiyatli topshirildi! ID: ${appId}`);
    return appId;
  };

  // Update Status (for CRM and Founder panels)
  const updateApplicationStatus = (appId, newStatus) => {
    setApplications(prev =>
      prev.map(app => app.id === appId ? { ...app, status: newStatus } : app)
    );
    notify(`Ariza holati yangilandi: ${newStatus}`);
  };

  // Export CSV for University Admin CRM
  const exportCRMToCSV = (uniIdFilter = null) => {
    const filtered = uniIdFilter
      ? applications.filter(a => a.universityId === uniIdFilter)
      : applications;

    if (filtered.length === 0) {
      notify("Eksport qilish uchun arizalar mavjud emas", "error");
      return;
    }

    const headers = ["Ariza ID", "Talaba", "Telefon", "JSHSHIR", "Universitet", "Fakultet", "Holat", "Sana"];
    const rows = filtered.map(a => [
      a.id,
      `"${a.applicantName}"`,
      `"${a.applicantPhone}"`,
      `"${a.applicantPinfl}"`,
      `"${a.universityName}"`,
      `"${a.programName}"`,
      a.status,
      `"${a.submittedAt}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `unigoh_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("CSV fayli yuklab olindi!");
  };

  // Certificate management
  const addCertificate = (newCert) => {
    const cert = {
      id: `cert-${Date.now()}`,
      ...newCert,
      isVerified: true
    };
    setStudentProfile(prev => ({
      ...prev,
      certificates: [...(prev.certificates || []), cert]
    }));
    notify(`${newCert.type} sertifikati muvaffaqiyatli saqlandi!`);
  };

  const removeCertificate = (id) => {
    setStudentProfile(prev => ({
      ...prev,
      certificates: (prev.certificates || []).filter(c => c.id !== id)
    }));
    notify("Sertifikat o'chirildi", "info");
  };

  const updateTestScores = (newScores) => {
    setStudentProfile(prev => ({
      ...prev,
      testScores: { ...prev.testScores, ...newScores }
    }));
    notify("Imtihon natijalari muvaffaqiyatli saqlandi!");
  };

  // Admin access request (password protected)
  const requestAdminAccess = (tab) => {
    if (userRole === 'master_admin') {
      setCurrentTab(tab);
      return;
    }
    setTargetAdminTab(tab);
    setIsAdminAuthModalOpen(true);
  };

  const verifyAdminPin = (enteredPin) => {
    // Secret founder PIN code (for demo / founder login)
    if (enteredPin === '7777') {
      setUserRole(targetAdminTab === 'founder' ? 'master_admin' : 'university_admin');
      setCurrentTab(targetAdminTab);
      setIsAdminAuthModalOpen(false);
      notify(targetAdminTab === 'founder' ? "Master Admin (Asoschi) sifatida kirdingiz!" : "OTM Qabul komissiyasi CRM sifatida kirdingiz!");
      return true;
    }
    notify("PIN kod noto'g'ri! (Faqat tizim egasi va OTM ma'murlari uchun)", "error");
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        selectedUniversity,
        setSelectedUniversity,
        selectedProgram,
        setSelectedProgram,
        isApplyModalOpen,
        setIsApplyModalOpen,
        selectedVoucher,
        setSelectedVoucher,
        isChatOpen,
        setIsChatOpen,
        studentProfile,
        setStudentProfile,
        addCertificate,
        removeCertificate,
        updateTestScores,
        userRole,
        setUserRole,
        isAdminAuthModalOpen,
        setIsAdminAuthModalOpen,
        requestAdminAccess,
        verifyAdminPin,
        applications,
        submitApplication,
        updateApplicationStatus,
        exportCRMToCSV,
        notification,
        notify
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
