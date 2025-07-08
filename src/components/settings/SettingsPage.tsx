import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Tag,
  User,
  Lock,
  Eye,
  EyeOff,
  Settings,
  Database,
  Download,
  Upload,
  Trash2,
  DollarSign,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { formatNumber } from "@/lib/utils";
import TopMobileNavigation from "../layout/TopMobileNavigation";
import MobileNavigationComponent from "../layout/MobileNavigation";
import { databaseService } from "@/services/databaseService";

interface SettingsPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

const SettingsPage = ({ onBack, onNavigate }: SettingsPageProps) => {
  // Pricing state - start with empty values
  const [singleSession, setSingleSession] = useState("");
  const [sessions13, setSessions13] = useState("");
  const [sessions15, setSessions15] = useState("");
  const [sessions30, setSessions30] = useState("");

  // User settings state
  const [username, setUsername] = useState("ADMIN");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [databaseHealth, setDatabaseHealth] = useState<any>(null);
  const [isCheckingDatabase, setIsCheckingDatabase] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedPricing = localStorage.getItem("gymPricingSettings");
    if (savedPricing) {
      try {
        const pricing = JSON.parse(savedPricing);
        setSingleSession(
          pricing.singleSession ? pricing.singleSession.toString() : "200",
        );
        setSessions13(
          pricing.sessions13 ? pricing.sessions13.toString() : "1500",
        );
        setSessions15(
          pricing.sessions15 ? pricing.sessions15.toString() : "1800",
        );
        setSessions30(
          pricing.sessions30 ? pricing.sessions30.toString() : "1800",
        );
      } catch (error) {
        console.error("Error loading pricing:", error);
        // Set default values if error
        setSingleSession("200");
        setSessions13("1500");
        setSessions15("1800");
        setSessions30("1800");
      }
    } else {
      // Set default values if no saved pricing
      setSingleSession("200");
      setSessions13("1500");
      setSessions15("1800");
      setSessions30("1800");
    }

    const savedUser = localStorage.getItem("gymUserSettings");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUsername(user.username || "ADMIN");
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    }

    // Check database health on load
    checkDatabaseHealth();
  }, []);

  // Check database health
  const checkDatabaseHealth = async () => {
    setIsCheckingDatabase(true);
    try {
      const health = await databaseService.checkDatabaseHealth();
      setDatabaseHealth(health);
    } catch (error) {
      console.error("Error checking database health:", error);
    } finally {
      setIsCheckingDatabase(false);
    }
  };

  // Clean database
  const cleanDatabase = async () => {
    if (
      !confirm(
        "هل أنت متأكد من تنظيف قاعدة البيانات؟ سيتم حذف السجلات التالفة.",
      )
    ) {
      return;
    }

    try {
      const result = await databaseService.cleanupDatabase();
      if (result.success) {
        toast({
          title: "تم التنظيف",
          description: `تم حذف ${result.cleaned.members + result.cleaned.payments + result.cleaned.activities} سجل تالف`,
        });
        checkDatabaseHealth(); // Refresh health check
      } else {
        toast({
          title: "خطأ",
          description: result.errors.join(", "),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تنظيف قاعدة البيانات",
        variant: "destructive",
      });
    }
  };

  // Optimize database
  const optimizeDatabase = async () => {
    if (
      !confirm(
        "هل أنت متأكد من تحسين قاعدة البيانات؟ سيتم حذف الأنشطة القديمة (أكثر من 3 أشهر).",
      )
    ) {
      return;
    }

    try {
      const result = await databaseService.optimizeDatabase();
      if (result.success) {
        toast({
          title: "تم التحسين",
          description: `تم حذف ${result.optimized.oldActivitiesRemoved} نشاط قديم`,
        });
        checkDatabaseHealth(); // Refresh health check
      } else {
        toast({
          title: "خطأ",
          description: result.errors.join(", "),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحسين قاعدة البيانات",
        variant: "destructive",
      });
    }
  };

  // Save pricing to localStorage
  const savePricing = () => {
    const pricing = {
      singleSession: parseInt(singleSession) || 0,
      sessions13: parseInt(sessions13) || 0,
      sessions15: parseInt(sessions15) || 0,
      sessions30: parseInt(sessions30) || 0,
    };

    localStorage.setItem("gymPricingSettings", JSON.stringify(pricing));

    toast({
      title: "تم حفظ الأسعار",
      description: "تم تحديث الأسعار في جميع أنحاء الموقع",
    });

    // Trigger price update event
    window.dispatchEvent(new Event("pricing-updated"));

    // Force page refresh to update all pricing throughout the system
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Save user settings to localStorage
  const saveUserSettings = () => {
    // Validate new password if provided
    if (newPassword && newPassword.length < 4) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 4 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    // Get current saved password or default
    const savedPassword = localStorage.getItem("gymPassword") || "ADMIN";

    // If changing password, validate current password
    if (newPassword) {
      if (!currentPassword) {
        toast({
          title: "خطأ",
          description: "يجب إدخال كلمة المرور الحالية",
          variant: "destructive",
        });
        return;
      }

      if (currentPassword !== savedPassword) {
        toast({
          title: "خطأ",
          description: "كلمة المرور الحالية غير صحيحة",
          variant: "destructive",
        });
        return;
      }
    }

    // Save username
    const userSettings = { username };
    localStorage.setItem("gymUserSettings", JSON.stringify(userSettings));

    // Update current user data
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    currentUser.userInfo = { ...currentUser.userInfo, username };
    localStorage.setItem("user", JSON.stringify(currentUser));

    // Save new password if provided
    if (newPassword) {
      localStorage.setItem("gymPassword", newPassword);
      toast({
        title: "تم التحديث",
        description:
          "تم تحديث اسم المستخدم وكلمة المرور بنجاح. سيتم تسجيل الخروج الآن.",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");

      // Log out user after password change
      setTimeout(() => {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }, 2000);
    } else {
      toast({
        title: "تم التحديث",
        description: "تم تحديث اسم المستخدم بنجاح",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
    }
  };

  // Import data from file
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
          title: "تم الاستيراد",
          description: "تم استيراد البيانات بنجاح",
        });

        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في استيراد البيانات",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Export data
  const exportData = () => {
    // Get all localStorage data with proper keys
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
      title: "تم التصدير",
      description: "تم تحميل ملف النسخة الاحتياطية",
    });
  };

  // Clear all data
  const clearAllData = () => {
    if (
      confirm(
        "هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!",
      )
    ) {
      // Clear all gym-related data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("gym-tracker") || key.startsWith("gym"))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));

      toast({
        title: "تم المسح",
        description: "تم حذف جميع البيانات بنجاح",
      });

      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <>
      <TopMobileNavigation
        activeItem="settings"
        setActiveItem={(item) => {
          if (item !== "settings" && onNavigate) {
            onNavigate(item);
          }
        }}
        onSettingsClick={() => {}}
      />

      <div className="bg-gradient-to-br from-bluegray-900 via-bluegray-800 to-bluegray-900 text-white min-h-screen overflow-y-auto fixed inset-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-20 pb-32 sm:pb-32 lg:pt-8 lg:pb-24 max-w-6xl xl:max-w-7xl h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10 h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent mb-2 lg:mb-3">
                الإعدادات
              </h1>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed">
                تخصيص إعدادات النظام
              </p>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8 lg:space-y-8 xl:space-y-12">
            {/* Pricing Section */}
            <Card className="bg-gradient-to-br from-bluegray-800/80 to-bluegray-900/80 backdrop-blur-xl border border-bluegray-600/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <CardHeader className="p-6 lg:p-8 xl:p-10">
                <CardTitle className="text-xl lg:text-2xl xl:text-3xl font-bold text-white flex items-center gap-3 lg:gap-4">
                  <Tag className="h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-yellow-400" />
                  الأسعار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6 xl:space-y-8 p-6 lg:p-8 xl:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
                  <div>
                    <Label className="text-gray-300 mb-2 lg:mb-3 block text-sm lg:text-base xl:text-lg font-medium">
                      حصة واحدة
                    </Label>
                    <Input
                      type="number"
                      value={singleSession}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === "" || /^\d+$/.test(value)) {
                          setSingleSession(value);
                        }
                      }}
                      className="bg-bluegray-700/50 border-bluegray-600 text-white h-12 lg:h-14 text-base lg:text-lg"
                      placeholder="أدخل السعر"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 lg:mb-3 block text-sm lg:text-base xl:text-lg font-medium">
                      13 حصة
                    </Label>
                    <Input
                      type="number"
                      value={sessions13}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === "" || /^\d+$/.test(value)) {
                          setSessions13(value);
                        }
                      }}
                      className="bg-bluegray-700/50 border-bluegray-600 text-white h-12 lg:h-14 text-base lg:text-lg"
                      placeholder="أدخل السعر"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 lg:mb-3 block text-sm lg:text-base xl:text-lg font-medium">
                      15 حصة
                    </Label>
                    <Input
                      type="number"
                      value={sessions15}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === "" || /^\d+$/.test(value)) {
                          setSessions15(value);
                        }
                      }}
                      className="bg-bluegray-700/50 border-bluegray-600 text-white h-12 lg:h-14 text-base lg:text-lg"
                      placeholder="أدخل السعر"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 lg:mb-3 block text-sm lg:text-base xl:text-lg font-medium">
                      30 حصة
                    </Label>
                    <Input
                      type="number"
                      value={sessions30}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === "" || /^\d+$/.test(value)) {
                          setSessions30(value);
                        }
                      }}
                      className="bg-bluegray-700/50 border-bluegray-600 text-white h-12 lg:h-14 text-base lg:text-lg"
                      placeholder="أدخل السعر"
                    />
                  </div>
                </div>

                <Button
                  onClick={savePricing}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white h-12 lg:h-14 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Save className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                  حفظ الأسعار
                </Button>
              </CardContent>
            </Card>

            {/* User Settings Section */}
            <Card className="bg-gradient-to-br from-bluegray-800/80 to-bluegray-900/80 backdrop-blur-xl border border-bluegray-600/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <CardHeader className="p-6 lg:p-8 xl:p-10">
                <CardTitle className="text-xl lg:text-2xl xl:text-3xl font-bold text-white flex items-center gap-3 lg:gap-4">
                  <User className="h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-blue-400" />
                  إعدادات المستخدم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6 xl:space-y-8 p-6 lg:p-8 xl:p-10">
                <div>
                  <Label className="text-gray-300 mb-2 block">
                    اسم المستخدم
                  </Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-bluegray-700/50 border-bluegray-600 text-white"
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">
                    كلمة المرور الحالية
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-bluegray-700/50 border-bluegray-600 text-white pr-12"
                      placeholder="أدخل كلمة المرور الحالية"
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
                  <Label className="text-gray-300 mb-2 block">
                    كلمة المرور الجديدة
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-bluegray-700/50 border-bluegray-600 text-white pr-12"
                      placeholder="أدخل كلمة المرور الجديدة"
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

                <Button
                  onClick={saveUserSettings}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>

            {/* Data Management Section */}
            <Card className="bg-gradient-to-br from-bluegray-800/80 to-bluegray-900/80 backdrop-blur-xl border border-bluegray-600/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <CardHeader className="p-6 lg:p-8 xl:p-10">
                <CardTitle className="text-xl lg:text-2xl xl:text-3xl font-bold text-white flex items-center gap-3 lg:gap-4">
                  <Database className="h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-green-400" />
                  إدارة البيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6 xl:space-y-8 p-6 lg:p-8 xl:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  <Button
                    onClick={exportData}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white h-12 lg:h-14 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Download className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    تصدير البيانات
                  </Button>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="import-file"
                    />
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12 lg:h-14 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() =>
                        document.getElementById("import-file")?.click()
                      }
                    >
                      <Upload className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                      استيراد البيانات
                    </Button>
                  </div>

                  <Button
                    onClick={clearAllData}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-12 lg:h-14 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    مسح جميع البيانات
                  </Button>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={cleanDatabase}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    تنظيف قاعدة البيانات
                  </Button>

                  <Button
                    onClick={optimizeDatabase}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    تحسين قاعدة البيانات
                  </Button>
                </div>

                {/* Database Health Status */}
                {databaseHealth && (
                  <div
                    className={`mt-6 p-4 rounded-lg border ${
                      databaseHealth.isHealthy
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    }`}
                  >
                    <h4
                      className={`font-semibold mb-2 ${
                        databaseHealth.isHealthy
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      حالة قاعدة البيانات:{" "}
                      {databaseHealth.isHealthy ? "سليمة" : "تحتاج صيانة"}
                    </h4>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-300">
                        الأعضاء:{" "}
                        {formatNumber(databaseHealth.stats.membersCount)} •
                        المدفوعات:{" "}
                        {formatNumber(databaseHealth.stats.paymentsCount)} •
                        الأنشطة:{" "}
                        {formatNumber(databaseHealth.stats.activitiesCount)}
                      </p>
                      {databaseHealth.issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-300 font-medium">
                            المشاكل المكتشفة:
                          </p>
                          <ul className="text-red-300 text-xs mt-1">
                            {databaseHealth.issues.map(
                              (issue: string, index: number) => (
                                <li key={index}>• {issue}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="text-blue-400 font-semibold mb-2">
                    معلومات مهمة:
                  </h4>
                  <ul className="text-sm text-blue-300 space-y-1">
                    <li>
                      • تصدير البيانات: حفظ نسخة احتياطية من جميع البيانات
                    </li>
                    <li>• استيراد البيانات: استعادة البيانات من ملف JSON</li>
                    <li>• تنظيف قاعدة البيانات: حذف السجلات التالفة</li>
                    <li>• تحسين قاعدة البيانات: حذف الأنشطة القديمة</li>
                    <li>• مسح البيانات: حذف جميع البيانات نهائياً</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigationComponent
        activeItem="settings"
        setActiveItem={(item) => {
          if (item !== "settings" && onNavigate) {
            onNavigate(item);
          }
        }}
        onTodayAttendanceClick={() => {
          if (onNavigate) {
            onNavigate("today-attendance");
          }
        }}
        onPendingPaymentsClick={() => {
          if (onNavigate) {
            onNavigate("pending-payments");
          }
        }}
        onAddSessionClick={() => {
          // Handle add session from settings
          if (onNavigate) {
            onNavigate("dashboard");
            // Trigger add session dialog after navigation
            setTimeout(() => {
              const event = new CustomEvent("openAddSessionDialog");
              window.dispatchEvent(event);
            }, 100);
          }
        }}
        onAddMemberClick={() => {
          // Handle add member from settings
          if (onNavigate) {
            onNavigate("attendance");
            // Trigger add member dialog after navigation
            setTimeout(() => {
              const event = new CustomEvent("openAddMemberDialog");
              window.dispatchEvent(event);
            }, 100);
          }
        }}
      />
    </>
  );
};

export default SettingsPage;
