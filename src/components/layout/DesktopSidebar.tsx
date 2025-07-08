import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  LogOut,
  Search,
  Plus,
  Users,
  Calendar,
  DollarSign,
  Download,
  Upload,
  Trash2,
  Tag,
  User,
  Database,
  Eye,
  EyeOff,
  X,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface DesktopSidebarProps {
  onAddSessionClick?: () => void;
  onAddMemberClick?: () => void;
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
  onUserGuideClick?: () => void;
}

const DesktopSidebar = ({
  onAddSessionClick = () => {},
  onAddMemberClick = () => {},
  onSettingsClick = () => {},
  onSearchClick = () => {},
  onUserGuideClick = () => {},
}: DesktopSidebarProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [isUserSettingsDialogOpen, setIsUserSettingsDialogOpen] =
    useState(false);
  const [isDataSettingsDialogOpen, setIsDataSettingsDialogOpen] =
    useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountName, setAccountName] = useState("المدير");
  const [accountEmail, setAccountEmail] = useState("admin@aminoGym.com");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Enhanced export data with comprehensive database handling
  const exportData = async () => {
    try {
      toast({
        title: "جاري تحضير البيانات...",
        description: "يرجى الانتظار، جاري جمع البيانات من قاعدة البيانات",
      });

      // Import services dynamically to get all data
      const [memberService, paymentService] = await Promise.all([
        import("@/services/memberService"),
        import("@/services/paymentService"),
      ]);

      // Fetch all data from IndexedDB
      const [members, payments, activities] = await Promise.all([
        memberService.getAllMembers(),
        paymentService.getAllPayments(),
        memberService.getRecentActivities(100000), // Get all activities
      ]);

      // Get settings from localStorage
      const settings = {
        pricing: localStorage.getItem("gymPricingSettings") || "{}",
        user: localStorage.getItem("gymUserSettings") || "{}",
        password: localStorage.getItem("gymPassword") || "ADMIN",
        notifications: localStorage.getItem("gymNotificationSettings") || "{}",
      };

      // Create comprehensive export data
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: "5.0",
          gymName: "Amino Gym",
          exportId: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          totalMembers: members.length,
          totalPayments: payments.length,
          totalActivities: activities.length,
          totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
          dataIntegrity: {
            membersChecksum: members.length,
            paymentsChecksum: payments.length,
            activitiesChecksum: activities.length,
            exportComplete: true,
          },
        },
        data: {
          members: members,
          payments: payments,
          activities: activities,
        },
        settings: settings,
        timestamp: new Date().toISOString(),
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const timestamp = new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");
      const fileName = `amino-gym-complete-backup-${timestamp}.json`;

      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ تم التصدير بنجاح",
        description: `تم تصدير ${members.length} عضو، ${payments.length} دفعة، و ${activities.length} نشاط`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "❌ خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات من قاعدة البيانات",
        variant: "destructive",
      });
    }
  };

  // Enhanced import data with comprehensive database handling
  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show confirmation dialog
    if (
      !confirm(
        "⚠️ هل أنت متأكد من استيراد البيانات؟ سيتم استبدال جميع البيانات الحالية في قاعدة البيانات.",
      )
    ) {
      return;
    }

    try {
      toast({
        title: "جاري استيراد البيانات...",
        description: "يرجى الانتظار، جاري معالجة الملف وحفظ البيانات",
      });

      // File validation
      if (file.size > 100 * 1024 * 1024) {
        throw new Error("حجم الملف كبير جداً (الحد الأقصى 100 ميجابايت)");
      }

      // Read and parse file
      const text = await file.text();
      if (!text.trim()) {
        throw new Error("الملف فارغ");
      }

      let importData;
      try {
        importData = JSON.parse(text);
      } catch (parseError) {
        throw new Error("ملف JSON غير صحيح أو تالف");
      }

      // Import services
      const [memberService, paymentService] = await Promise.all([
        import("@/services/memberService"),
        import("@/services/paymentService"),
      ]);

      // Extract data from different formats
      let members = [];
      let payments = [];
      let activities = [];
      let settings = {};

      // Handle new format with metadata
      if (importData.data) {
        members = importData.data.members || [];
        payments = importData.data.payments || [];
        activities = importData.data.activities || [];
        settings = importData.settings || {};
      }
      // Handle old format
      else {
        members = importData.members || [];
        payments = importData.payments || [];
        activities = importData.activities || [];
        settings = importData.settings || {};
      }

      if (!Array.isArray(members)) members = [];
      if (!Array.isArray(payments)) payments = [];
      if (!Array.isArray(activities)) activities = [];

      let importedMembers = 0;
      let importedPayments = 0;
      let importedActivities = 0;
      const errors = [];

      // Import members
      for (let i = 0; i < members.length; i++) {
        try {
          const member = members[i];
          if (!member || !member.name) {
            errors.push(`عضو غير صحيح في الفهرس ${i}`);
            continue;
          }

          const cleanMember = {
            id: member.id || `imported_member_${Date.now()}_${i}`,
            name: String(member.name).trim(),
            membershipStatus: ["active", "expired", "pending"].includes(
              member.membershipStatus,
            )
              ? member.membershipStatus
              : "pending",
            lastAttendance:
              member.lastAttendance || new Date().toISOString().split("T")[0],
            imageUrl: member.imageUrl || "",
            phoneNumber: member.phoneNumber || "",
            email: member.email || "",
            membershipType: member.membershipType || "",
            membershipStartDate: member.membershipStartDate || "",
            membershipEndDate: member.membershipEndDate || "",
            subscriptionType: member.subscriptionType,
            sessionsRemaining: Math.max(
              0,
              Number(member.sessionsRemaining) || 0,
            ),
            subscriptionPrice: Math.max(
              0,
              Number(member.subscriptionPrice) || 0,
            ),
            paymentStatus: ["paid", "unpaid", "partial"].includes(
              member.paymentStatus,
            )
              ? member.paymentStatus
              : "unpaid",
            note: member.note || "",
          };

          await memberService.addOrUpdateMemberWithId(cleanMember);
          importedMembers++;
        } catch (error) {
          errors.push(`خطأ في استيراد عضو ${i}: ${error}`);
        }
      }

      // Import payments
      for (let i = 0; i < payments.length; i++) {
        try {
          const payment = payments[i];
          if (!payment || payment.amount === undefined) {
            errors.push(`دفعة غير صحيحة في الفهرس ${i}`);
            continue;
          }

          const cleanPayment = {
            id: payment.id || `imported_payment_${Date.now()}_${i}`,
            memberId: payment.memberId || "unknown",
            amount: Math.max(0, Number(payment.amount) || 0),
            date: payment.date || new Date().toISOString(),
            subscriptionType: payment.subscriptionType || "غير محدد",
            paymentMethod: ["cash", "card", "transfer"].includes(
              payment.paymentMethod,
            )
              ? payment.paymentMethod
              : "cash",
            status: ["completed", "pending", "cancelled"].includes(
              payment.status,
            )
              ? payment.status
              : "completed",
            invoiceNumber: payment.invoiceNumber || `INV-${Date.now()}-${i}`,
            notes: payment.notes || "",
            receiptUrl: payment.receiptUrl || "",
          };

          await paymentService.addOrUpdatePaymentWithId(cleanPayment);
          importedPayments++;
        } catch (error) {
          errors.push(`خطأ في استيراد دفعة ${i}: ${error}`);
        }
      }

      // Import activities
      for (let i = 0; i < activities.length; i++) {
        try {
          const activity = activities[i];
          if (!activity || !activity.memberId) {
            continue;
          }

          const cleanActivity = {
            id: activity.id || `imported_activity_${Date.now()}_${i}`,
            memberId: activity.memberId,
            memberName: activity.memberName || "",
            memberImage: activity.memberImage || "",
            activityType: [
              "check-in",
              "membership-renewal",
              "payment",
              "other",
            ].includes(activity.activityType)
              ? activity.activityType
              : "other",
            timestamp: activity.timestamp || new Date().toISOString(),
            details: activity.details || "",
          };

          await memberService.addOrUpdateActivityWithId(cleanActivity);
          importedActivities++;
        } catch (error) {
          // Skip failed activities silently
        }
      }

      // Import settings
      if (settings.pricing) {
        localStorage.setItem("gymPricingSettings", settings.pricing);
      }
      if (settings.user) {
        localStorage.setItem("gymUserSettings", settings.user);
      }
      if (settings.notifications) {
        localStorage.setItem("gymNotificationSettings", settings.notifications);
      }

      toast({
        title: "✅ تم استيراد البيانات بنجاح",
        description: `تم استيراد ${importedMembers} عضو، ${importedPayments} دفعة، و ${importedActivities} نشاط`,
      });

      if (errors.length > 0) {
        setTimeout(() => {
          toast({
            title: "⚠️ تحذيرات الاستيراد",
            description: `تم تجاهل ${errors.length} عنصر بسبب بيانات غير صحيحة`,
            variant: "destructive",
          });
        }, 2000);
      }

      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        title: "❌ خطأ في الاستيراد",
        description:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء الاستيراد",
        variant: "destructive",
      });
    }
  };

  // Enhanced clear all data with comprehensive database cleanup
  const clearAllData = async () => {
    // First confirmation
    if (
      !confirm(
        "⚠️ تحذير خطير: هل أنت متأكد من حذف جميع البيانات من قاعدة البيانات؟",
      )
    ) {
      return;
    }

    // Second confirmation for safety
    if (
      !confirm(
        "⚠️ تأكيد نهائي: سيتم حذف جميع الأعضاء والمدفوعات والأنشطة نهائياً من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء!",
      )
    ) {
      return;
    }

    // Third confirmation with typing requirement
    const confirmText = prompt(
      "للتأكيد النهائي، اكتب 'حذف جميع البيانات' بالضبط:",
    );
    if (confirmText !== "حذف جميع البيانات") {
      toast({
        title: "تم إلغاء العملية",
        description: "لم يتم حذف أي بيانات",
      });
      return;
    }

    try {
      toast({
        title: "جاري حذف جميع البيانات...",
        description: "يرجى الانتظار أثناء حذف جميع البيانات من قاعدة البيانات",
      });

      // Clear all localStorage data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("gym-tracker") || key.startsWith("gym"))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear IndexedDB databases completely
      if ("indexedDB" in window) {
        try {
          // Get all databases
          const databases = await indexedDB.databases();

          // Delete gym-tracker databases
          const deletePromises = databases
            .filter((db) => db.name && db.name.includes("gym-tracker"))
            .map((db) => {
              return new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
                deleteReq.onblocked = () => {
                  console.warn(`Database ${db.name} deletion blocked`);
                  resolve(); // Continue anyway
                };
              });
            });

          await Promise.all(deletePromises);

          // Also clear any remaining localforage instances
          try {
            const localforage = (await import("localforage")).default;
            await localforage.clear();
          } catch (error) {
            console.log("LocalForage cleanup completed");
          }
        } catch (error) {
          console.warn("IndexedDB cleanup completed with warnings:", error);
        }
      }

      // Clear any cached data
      if ("caches" in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName)),
          );
        } catch (error) {
          console.log("Cache cleanup completed");
        }
      }

      toast({
        title: "✅ تم حذف جميع البيانات",
        description:
          "تم حذف جميع البيانات نهائياً من قاعدة البيانات. سيتم إعادة تحميل الصفحة.",
        variant: "destructive",
      });

      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error("خطأ في حذف البيانات:", error);
      toast({
        title: "❌ خطأ في حذف البيانات",
        description:
          "حدث خطأ أثناء حذف البيانات من قاعدة البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleSearch = () => {
    onSearchClick();
  };

  return (
    <>
      {/* Enhanced Desktop Left Sidebar Content */}
      <div className="p-8 flex flex-col h-full relative">
        {/* Enhanced Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-600/50 shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-lg opacity-50" />
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl border-4 border-white/20">
                <img
                  src="/yacin-gym-logo.png"
                  alt="Amino Gym"
                  className="w-20 h-20 rounded-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
              Amino Gym
            </h2>
            <p className="text-slate-300 font-medium">
              نظام إدارة الصالة الرياضية
            </p>
            <div className="mt-3 flex justify-center">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full px-3 py-1 border border-green-400/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-300 text-xs font-medium">
                    متصل
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Primary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8 mb-10"
        >
          {/* Enhanced Search Button */}
          <div className="text-center">
            <motion.div
              className="relative mx-auto w-fit"
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.92 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-2xl opacity-60 animate-pulse" />
              <motion.button
                className="relative p-6 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 shadow-2xl border-4 border-yellow-400/50 backdrop-blur-sm hover:border-yellow-300/70 transition-all duration-300"
                onClick={handleSearch}
              >
                <Search size={32} className="text-white drop-shadow-lg" />
              </motion.button>
            </motion.div>
            <p className="text-slate-300 text-sm mt-3 font-medium">
              البحث السريع
            </p>
          </div>

          {/* Enhanced Action Buttons Row */}
          <div className="flex justify-center items-center gap-6">
            {/* Enhanced Add Session Button */}
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
              <motion.button
                className="relative p-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-2xl border-3 border-green-400/50 backdrop-blur-sm hover:border-green-300/70 transition-all duration-300"
                onClick={onAddSessionClick}
              >
                <Plus size={24} className="text-white drop-shadow-lg" />
              </motion.button>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs text-green-300 font-medium whitespace-nowrap">
                  إضافة حصة
                </span>
              </div>
            </motion.div>

            {/* Enhanced Add Member Button */}
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
              <motion.button
                className="relative p-5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-2xl border-3 border-blue-400/50 backdrop-blur-sm hover:border-blue-300/70 transition-all duration-300"
                onClick={onAddMemberClick}
              >
                <Users size={24} className="text-white drop-shadow-lg" />
              </motion.button>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
                  إضافة عضو
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced System Actions - Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-auto flex justify-center items-center gap-3"
        >
          {/* User Guide Button */}
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
            <motion.button
              className="relative p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-2xl border-3 border-blue-400/50 backdrop-blur-sm hover:border-blue-300/70 transition-all duration-300"
              onClick={onUserGuideClick}
            >
              <BookOpen size={20} className="text-white drop-shadow-lg" />
            </motion.button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
                دليل الاستخدام
              </span>
            </div>
          </motion.div>

          {/* Settings Button */}
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
            <motion.button
              className="relative p-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-2xl border-3 border-yellow-400/50 backdrop-blur-sm hover:border-yellow-300/70 transition-all duration-300"
              onClick={onSettingsClick}
            >
              <Settings size={20} className="text-slate-900 drop-shadow-lg" />
            </motion.button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-xs text-yellow-300 font-medium whitespace-nowrap">
                الإعدادات
              </span>
            </div>
          </motion.div>

          {/* Logout Button */}
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
            <motion.button
              className="relative p-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-2xl border-3 border-red-400/50 backdrop-blur-sm hover:border-red-300/70 transition-all duration-300"
              onClick={handleLogout}
            >
              <LogOut size={20} className="text-white drop-shadow-lg" />
            </motion.button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-xs text-red-300 font-medium whitespace-nowrap">
                تسجيل الخروج
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 pt-6 border-t border-gradient-to-r from-slate-600/30 via-slate-500/50 to-slate-600/30"
        >
          <div className="text-center"></div>
        </motion.div>
      </div>
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              الإعدادات
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Pricing Section */}
            <motion.button
              onClick={() => {
                setIsPricingDialogOpen(true);
                setIsSettingsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 rounded-xl p-5 border border-yellow-500/40 text-right transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Tag className="h-5 w-5 text-yellow-400" />
                  </div>
                  <span className="text-white font-bold text-lg">الأسعار</span>
                </div>
                <span className="text-yellow-400 text-xl">›</span>
              </div>
            </motion.button>

            {/* User Settings */}
            <motion.button
              onClick={() => {
                setIsUserSettingsDialogOpen(true);
                setIsSettingsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 rounded-xl p-5 border border-blue-500/40 text-right transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-white font-bold text-lg">
                    الإعدادات الشخصية
                  </span>
                </div>
                <span className="text-blue-400 text-xl">›</span>
              </div>
            </motion.button>

            {/* Data Management Section */}
            <motion.button
              onClick={() => {
                setIsDataSettingsDialogOpen(true);
                setIsSettingsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 rounded-xl p-5 border border-green-500/40 text-right transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Database className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-white font-bold text-lg">
                    إدارة البيانات
                  </span>
                </div>
                <span className="text-green-400 text-xl">›</span>
              </div>
            </motion.button>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsSettingsOpen(false)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Pricing Dialog */}
      <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              الأسعار
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="bg-bluegray-700/50 rounded-lg p-4 border border-bluegray-600/50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">حصة واحدة</span>
                  <span className="text-yellow-400 font-semibold">200 دج</span>
                </div>
              </div>
              <div className="bg-bluegray-700/50 rounded-lg p-4 border border-bluegray-600/50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">13 حصة</span>
                  <span className="text-yellow-400 font-semibold">
                    1,500 دج
                  </span>
                </div>
              </div>
              <div className="bg-bluegray-700/50 rounded-lg p-4 border border-bluegray-600/50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">15 حصة</span>
                  <span className="text-yellow-400 font-semibold">
                    1,800 دج
                  </span>
                </div>
              </div>
              <div className="bg-bluegray-700/50 rounded-lg p-4 border border-bluegray-600/50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">30 حصة</span>
                  <span className="text-yellow-400 font-semibold">
                    1,800 دج
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsPricingDialogOpen(false)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* User Settings Dialog */}
      <Dialog
        open={isUserSettingsDialogOpen}
        onOpenChange={setIsUserSettingsDialogOpen}
      >
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              الإعدادات الشخصية
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <button
              onClick={() => {
                setIsUserSettingsDialogOpen(false);
                setIsPasswordDialogOpen(true);
              }}
              className="w-full bg-bluegray-700/50 hover:bg-bluegray-600/50 rounded-lg p-4 border border-bluegray-600/50 text-right transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-300">تغيير كلمة المرور</span>
                <span className="text-blue-400">›</span>
              </div>
            </button>
            <button
              onClick={() => {
                setIsUserSettingsDialogOpen(false);
                setIsAccountDialogOpen(true);
              }}
              className="w-full bg-bluegray-700/50 hover:bg-bluegray-600/50 rounded-lg p-4 border border-bluegray-600/50 text-right transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-300">معلومات الحساب</span>
                <span className="text-blue-400">›</span>
              </div>
            </button>
            <button
              onClick={() => {
                setIsUserSettingsDialogOpen(false);
                setIsNotificationDialogOpen(true);
              }}
              className="w-full bg-bluegray-700/50 hover:bg-bluegray-600/50 rounded-lg p-4 border border-bluegray-600/50 text-right transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-300">إعدادات الإشعارات</span>
                <span className="text-blue-400">›</span>
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsUserSettingsDialogOpen(false)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Data Settings Dialog */}
      <Dialog
        open={isDataSettingsDialogOpen}
        onOpenChange={setIsDataSettingsDialogOpen}
      >
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              إدارة البيانات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <motion.button
              onClick={() => {
                setIsDataSettingsDialogOpen(false);
                exportData();
              }}
              className="w-full bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 rounded-xl p-5 border border-green-500/40 text-right transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Download className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-green-300 font-bold text-lg">
                    تصدير البيانات
                  </span>
                </div>
                <span className="text-green-400 text-xl">›</span>
              </div>
            </motion.button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="import-file-data"
              />
              <motion.button
                onClick={() =>
                  document.getElementById("import-file-data")?.click()
                }
                className="w-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 rounded-xl p-5 border border-blue-500/40 text-right transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Upload className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-blue-300 font-bold text-lg">
                      استيراد البيانات
                    </span>
                  </div>
                  <span className="text-blue-400 text-xl">›</span>
                </div>
              </motion.button>
            </div>

            <motion.button
              onClick={() => {
                setIsDataSettingsDialogOpen(false);
                clearAllData();
              }}
              className="w-full bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 rounded-xl p-5 border border-red-500/40 text-right transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </div>
                  <span className="text-red-300 font-bold text-lg">
                    مسح جميع البيانات
                  </span>
                </div>
                <span className="text-red-400 text-xl">›</span>
              </div>
            </motion.button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsDataSettingsDialogOpen(false)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Password Change Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              تغيير كلمة المرور
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPasswordDesktop" className="text-gray-300">
                كلمة المرور الحالية
              </Label>
              <div className="relative">
                <Input
                  id="currentPasswordDesktop"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-bluegray-700 border-bluegray-600 text-white pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPasswordDesktop" className="text-gray-300">
                كلمة المرور الجديدة
              </Label>
              <div className="relative">
                <Input
                  id="newPasswordDesktop"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-bluegray-700 border-bluegray-600 text-white pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPasswordDesktop" className="text-gray-300">
                تأكيد كلمة المرور
              </Label>
              <Input
                id="confirmPasswordDesktop"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-bluegray-700 border-bluegray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              className="border-bluegray-600 text-gray-300 hover:bg-bluegray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (!currentPassword || !newPassword || !confirmPassword) {
                  toast({
                    title: "خطأ في البيانات",
                    description: "يرجى ملء جميع الحقول",
                    variant: "destructive",
                  });
                  return;
                }

                if (newPassword !== confirmPassword) {
                  toast({
                    title: "خطأ في كلمة المرور",
                    description: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
                    variant: "destructive",
                  });
                  return;
                }

                // Handle password change logic here
                localStorage.setItem("gymPassword", newPassword);

                toast({
                  title: "تم تغيير كلمة المرور",
                  description: "تم تغيير كلمة المرور بنجاح",
                });

                setIsPasswordDialogOpen(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Account Info Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              معلومات الحساب
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountNameDesktop" className="text-gray-300">
                اسم المستخدم
              </Label>
              <Input
                id="accountNameDesktop"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="bg-bluegray-700 border-bluegray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="accountEmailDesktop" className="text-gray-300">
                البريد الإلكتروني
              </Label>
              <Input
                id="accountEmailDesktop"
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                className="bg-bluegray-700 border-bluegray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAccountDialogOpen(false)}
              className="border-bluegray-600 text-gray-300 hover:bg-bluegray-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                // Handle account info update logic here
                localStorage.setItem(
                  "gymUserSettings",
                  JSON.stringify({
                    name: accountName,
                    email: accountEmail,
                  }),
                );

                toast({
                  title: "تم حفظ المعلومات",
                  description: "تم حفظ معلومات الحساب بنجاح",
                });

                setIsAccountDialogOpen(false);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Notifications Dialog */}
      <Dialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
      >
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              إعدادات الإشعارات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bluegray-700/50 rounded-lg border border-bluegray-600/50">
              <span className="text-gray-300">تفعيل الإشعارات</span>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${notificationsEnabled ? "bg-blue-500" : "bg-gray-600"}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                localStorage.setItem(
                  "gymNotificationSettings",
                  JSON.stringify({
                    enabled: notificationsEnabled,
                  }),
                );

                toast({
                  title: "تم حفظ الإعدادات",
                  description: "تم حفظ إعدادات الإشعارات بنجاح",
                });

                setIsNotificationDialogOpen(false);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DesktopSidebar;
