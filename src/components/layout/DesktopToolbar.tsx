import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface DesktopToolbarProps {
  onTodayAttendanceClick?: () => void;
  onPendingPaymentsClick?: () => void;
  onAddSessionClick?: () => void;
  onAddMemberClick?: () => void;
  onSettingsClick?: () => void;
}

const DesktopToolbar = ({
  onTodayAttendanceClick = () => {},
  onPendingPaymentsClick = () => {},
  onAddSessionClick = () => {},
  onAddMemberClick = () => {},
  onSettingsClick = () => {},
}: DesktopToolbarProps) => {
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

  // Export data
  const exportData = () => {
    try {
      const getAllLocalStorageData = () => {
        const data: any = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("gym-tracker")) {
            data[key] = localStorage.getItem(key);
          }
        }
        return data;
      };

      const data = {
        ...getAllLocalStorageData(),
        settings: {
          pricing: localStorage.getItem("gymPricingSettings") || "{}",
          user: localStorage.getItem("gymUserSettings") || "{}",
          password: localStorage.getItem("gymPassword") || "ADMIN",
        },
        timestamp: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `amino-gym-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير جميع البيانات إلى ملف JSON",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  // Import data from file
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show confirmation dialog
    if (
      !confirm(
        "هل أنت متأكد من استيراد البيانات؟ سيتم استبدال البيانات الحالية.",
      )
    ) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Import all data
        if (data.members)
          localStorage.setItem("gym-tracker-members", data.members);
        if (data.payments)
          localStorage.setItem("gym-tracker-payments", data.payments);
        if (data.activities)
          localStorage.setItem("gym-tracker-activities", data.activities);
        if (data.settings?.pricing)
          localStorage.setItem("gymPricingSettings", data.settings.pricing);
        if (data.settings?.user)
          localStorage.setItem("gymUserSettings", data.settings.user);

        toast({
          title: "تم الاستيراد بنجاح",
          description:
            "تم استيراد جميع البيانات بنجاح. سيتم إعادة تحميل الصفحة.",
        });
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error("Error importing data:", error);
        toast({
          title: "فشل في الاستيراد",
          description: "تأكد من أن الملف صحيح ومن نوع JSON",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Clear all data
  const clearAllData = async () => {
    // First confirmation
    if (!confirm("⚠️ تحذير: هل أنت متأكد من حذف جميع البيانات؟")) {
      return;
    }

    // Second confirmation for safety
    if (
      !confirm(
        "⚠️ تأكيد نهائي: سيتم حذف جميع الأعضاء والمدفوعات والأنشطة نهائياً. لا يمكن التراجع عن هذا الإجراء!",
      )
    ) {
      return;
    }

    try {
      toast({
        title: "جاري حذف البيانات...",
        description: "يرجى الانتظار أثناء حذف جميع البيانات",
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

      // Clear IndexedDB data as well
      if ("indexedDB" in window) {
        try {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && db.name.includes("gym-tracker")) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (error) {
          console.log("تم تنظيف البيانات المحلية");
        }
      }

      toast({
        title: "تم حذف جميع البيانات",
        description: "تم حذف جميع البيانات نهائياً. سيتم إعادة تحميل الصفحة.",
        variant: "destructive",
      });

      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("خطأ في حذف البيانات:", error);
      toast({
        title: "خطأ في حذف البيانات",
        description: "حدث خطأ أثناء حذف البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <>
      {/* Desktop Toolbar - Only visible on large screens */}
      <div className="hidden lg:block mb-4 lg:mb-6">
        {/* Main Action Bar */}
        <Card className="bg-gradient-to-br from-bluegray-800/90 to-bluegray-900/90 backdrop-blur-xl border border-bluegray-600/50 shadow-2xl rounded-xl lg:rounded-2xl overflow-hidden">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between gap-4 lg:gap-6">
              {/* Primary Actions - Left */}
              <div className="flex items-center gap-2 lg:gap-4">
                <motion.button
                  className="group relative flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2.5 lg:py-3 bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-500 hover:to-emerald-600 text-white rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-400/20 text-sm lg:text-base"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onAddSessionClick}
                >
                  <div className="p-1 bg-white/20 rounded-md lg:rounded-lg">
                    <Plus
                      size={16}
                      className="lg:w-[18px] lg:h-[18px] text-white"
                    />
                  </div>
                  <span className="font-semibold">إضافة حصة</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg lg:rounded-xl" />
                </motion.button>

                <motion.button
                  className="group relative flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2.5 lg:py-3 bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-400/20 text-sm lg:text-base"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onAddMemberClick}
                >
                  <div className="p-1 bg-white/20 rounded-md lg:rounded-lg">
                    <Users
                      size={16}
                      className="lg:w-[18px] lg:h-[18px] text-white"
                    />
                  </div>
                  <span className="font-semibold">إضافة عضو</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg lg:rounded-xl" />
                </motion.button>
              </div>

              {/* Search Bar - Center */}
              <div className="flex-1 max-w-md lg:max-w-lg">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg lg:rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <Search
                      className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-400 transition-colors duration-300"
                      size={16}
                    />
                    <Input
                      type="text"
                      placeholder="البحث في الأعضاء والمدفوعات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3 bg-bluegray-700/60 hover:bg-bluegray-700/80 border-bluegray-600/50 hover:border-blue-500/50 text-white placeholder-gray-400 rounded-lg lg:rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm lg:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* System Actions - Right */}
              <div className="flex items-center gap-2 lg:gap-3">
                <motion.button
                  className="group relative p-2.5 lg:p-3 bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 hover:from-yellow-500 hover:to-yellow-600 text-bluegray-900 rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-400/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSettingsOpen(true)}
                  title="الإعدادات"
                >
                  <Settings
                    size={18}
                    className="lg:w-5 lg:h-5 text-bluegray-900"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg lg:rounded-xl" />
                </motion.button>

                <motion.button
                  className="group relative p-2.5 lg:p-3 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white rounded-lg lg:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-400/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  title="تسجيل الخروج"
                >
                  <LogOut size={18} className="lg:w-5 lg:h-5 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg lg:rounded-xl" />
                </motion.button>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Access Bar */}
        <Card className="mt-3 lg:mt-4 bg-gradient-to-r from-bluegray-800/60 to-bluegray-900/60 backdrop-blur-xl border border-bluegray-600/30 shadow-lg rounded-lg lg:rounded-xl">
          <div className="p-3 lg:p-4">
            <div className="flex items-center justify-center gap-4 lg:gap-6">
              <motion.button
                className="group flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-300 hover:text-purple-200 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onTodayAttendanceClick}
              >
                <Calendar size={14} className="lg:w-4 lg:h-4" />
                <span className="text-xs lg:text-sm font-medium">
                  حضور اليوم
                </span>
              </motion.button>

              <motion.button
                className="group flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 text-orange-300 hover:text-orange-200 rounded-lg border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPendingPaymentsClick}
              >
                <DollarSign size={14} className="lg:w-4 lg:h-4" />
                <span className="text-xs lg:text-sm font-medium">
                  المدفوعات المعلقة
                </span>
              </motion.button>

              <div className="h-6 w-px bg-gradient-to-b from-transparent via-bluegray-500/50 to-transparent" />

              <motion.button
                className="group flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-300 hover:text-emerald-200 rounded-lg border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsSettingsOpen(false);
                  exportData();
                }}
              >
                <Download size={14} className="lg:w-4 lg:h-4" />
                <span className="text-xs lg:text-sm font-medium">
                  تصدير البيانات
                </span>
              </motion.button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="import-file-toolbar"
                />
                <motion.button
                  className="group flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 hover:text-blue-200 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    document.getElementById("import-file-toolbar")?.click()
                  }
                >
                  <Upload size={14} className="lg:w-4 lg:h-4" />
                  <span className="text-xs lg:text-sm font-medium">
                    استيراد البيانات
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-bluegray-800 text-white border-bluegray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              الإعدادات
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Pricing Section */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsPricingDialogOpen(true);
                  setIsSettingsOpen(false);
                }}
                className="w-full bg-bluegray-700/50 hover:bg-bluegray-600/50 rounded-lg p-4 border border-bluegray-600/50 text-right transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-semibold">الأسعار</span>
                  </div>
                  <span className="text-yellow-400">›</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsUserSettingsDialogOpen(true);
                  setIsSettingsOpen(false);
                }}
                className="w-full bg-bluegray-700/50 hover:bg-bluegray-600/50 rounded-lg p-4 border border-bluegray-600/50 text-right transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-semibold">
                      الإعدادات الشخصية
                    </span>
                  </div>
                  <span className="text-blue-400">›</span>
                </div>
              </button>
            </div>

            {/* Data Management Section */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsDataSettingsDialogOpen(true);
                  setIsSettingsOpen(false);
                }}
                className="w-full bg-bluegray-700/50 hover:bg-bluegray-600/50 rounded-lg p-4 border border-bluegray-600/50 text-right transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-green-400" />
                    <span className="text-white font-semibold">
                      إعدادات البيانات
                    </span>
                  </div>
                  <span className="text-green-400">›</span>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    exportData();
                  }}
                  className="bg-green-600/20 hover:bg-green-600/30 rounded-lg p-3 border border-green-500/50 text-center transition-colors"
                >
                  <Download className="h-4 w-4 text-green-400 mx-auto mb-1" />
                  <span className="text-green-300 text-xs">تصدير</span>
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="import-file-desktop"
                  />
                  <button
                    onClick={() =>
                      document.getElementById("import-file-desktop")?.click()
                    }
                    className="w-full bg-blue-600/20 hover:bg-blue-600/30 rounded-lg p-3 border border-blue-500/50 text-center transition-colors"
                  >
                    <Upload className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                    <span className="text-blue-300 text-xs">استيراد</span>
                  </button>
                </div>
              </div>
            </div>
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
              إعدادات البيانات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <button
              onClick={() => {
                setIsDataSettingsDialogOpen(false);
                exportData();
              }}
              className="w-full bg-green-600/20 hover:bg-green-600/30 rounded-lg p-4 border border-green-500/50 text-right transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-green-400" />
                  <span className="text-green-300">تصدير البيانات</span>
                </div>
                <span className="text-green-400">›</span>
              </div>
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="import-file-data"
              />
              <button
                onClick={() =>
                  document.getElementById("import-file-data")?.click()
                }
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 rounded-lg p-4 border border-blue-500/50 text-right transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-blue-400" />
                    <span className="text-blue-300">استيراد البيانات</span>
                  </div>
                  <span className="text-blue-400">›</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setIsDataSettingsDialogOpen(false);
                clearAllData();
              }}
              className="w-full bg-red-600/20 hover:bg-red-600/30 rounded-lg p-4 border border-red-500/50 text-right transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-400" />
                  <span className="text-red-300">مسح جميع البيانات</span>
                </div>
                <span className="text-red-400">›</span>
              </div>
            </button>
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

export default DesktopToolbar;
