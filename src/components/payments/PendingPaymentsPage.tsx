import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  Calendar,
  DollarSign,
  CreditCard,
  ArrowLeft,
  AlertTriangle,
  Clock,
  User,
  Filter,
} from "lucide-react";
import { getAllMembers, Member } from "@/services/memberService";
import { formatDate, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import TopMobileNavigation from "../layout/TopMobileNavigation";
import MobileNavigationComponent from "../layout/MobileNavigation";

interface PendingPaymentsPageProps {
  onBack?: () => void;
}

const PendingPaymentsPage = ({ onBack }: PendingPaymentsPageProps) => {
  const [allUnpaidMembers, setAllUnpaidMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch all unpaid members
  useEffect(() => {
    const fetchUnpaidMembers = async () => {
      setLoading(true);
      try {
        const members = await getAllMembers();

        // Filter members with pending payments or expired subscriptions
        const unpaidMembersList = members.filter((member) => {
          const hasUnpaidStatus =
            member.paymentStatus === "unpaid" ||
            member.paymentStatus === "partial";
          const hasPendingMembership = member.membershipStatus === "pending";
          const hasZeroSessions =
            member.sessionsRemaining !== undefined &&
            member.sessionsRemaining === 0;

          // Check if subscription month has ended
          const hasExpiredSubscription = (() => {
            if (!member.membershipStartDate) return false;

            const startDate = new Date(member.membershipStartDate);
            const currentDate = new Date();

            // Calculate one month from start date
            const oneMonthLater = new Date(startDate);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

            // Check if current date is past the one month mark
            return currentDate > oneMonthLater;
          })();

          return (
            hasUnpaidStatus ||
            hasPendingMembership ||
            hasZeroSessions ||
            hasExpiredSubscription
          );
        });

        setAllUnpaidMembers(unpaidMembersList);
      } catch (error) {
        console.error("Error fetching unpaid members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnpaidMembers();
  }, []);

  // Apply period filter
  useEffect(() => {
    const applyPeriodFilter = () => {
      if (selectedPeriod === "all") {
        setFilteredMembers(allUnpaidMembers);
        return;
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const filtered = allUnpaidMembers.filter((member) => {
        if (!member.membershipStartDate) return false;

        const memberDate = new Date(member.membershipStartDate);
        const memberMonth = memberDate.getMonth();
        const memberYear = memberDate.getFullYear();

        switch (selectedPeriod) {
          case "thisMonth":
            return memberMonth === currentMonth && memberYear === currentYear;

          case "lastMonth":
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear =
              currentMonth === 0 ? currentYear - 1 : currentYear;
            return memberMonth === lastMonth && memberYear === lastMonthYear;

          case "expired":
            // Check if subscription has expired (more than 1 month old)
            const oneMonthLater = new Date(memberDate);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            return currentDate > oneMonthLater;

          default:
            return true;
        }
      });

      setFilteredMembers(filtered);
    };

    applyPeriodFilter();
  }, [allUnpaidMembers, selectedPeriod]);

  // Enhanced scroll handler to hide keyboard on mobile and manage header visibility
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = event.currentTarget.scrollTop;

    // Header visibility logic
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down and past threshold - hide header
      setIsHeaderVisible(false);
    } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
      // Scrolling up or near top - show header
      setIsHeaderVisible(true);
    }

    setLastScrollY(currentScrollY);

    // Force blur on any active input to hide keyboard
    const activeElement = document.activeElement as HTMLElement;
    if (
      activeElement &&
      activeElement.blur &&
      activeElement.tagName !== "BODY"
    ) {
      activeElement.blur();
    }

    // Additional mobile keyboard hiding techniques
    if (window.innerHeight < window.outerHeight) {
      // Keyboard might be open, try to close it
      window.scrollTo(0, 1);
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  };

  // Enhanced scroll and touch event listeners for mobile
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    // Prevent body scroll when scrolling inside container
    const preventBodyScroll = (e: TouchEvent) => {
      if (scrollContainer && scrollContainer.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };

    // Add global touch handlers
    const handleGlobalTouchStart = () => {
      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement &&
        activeElement.blur &&
        activeElement.tagName !== "BODY"
      ) {
        activeElement.blur();
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      document.addEventListener("touchstart", preventBodyScroll, {
        passive: false,
      });
      document.addEventListener("touchstart", handleGlobalTouchStart, {
        passive: true,
      });

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
        document.removeEventListener("touchstart", preventBodyScroll);
        document.removeEventListener("touchstart", handleGlobalTouchStart);
      };
    }
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col overflow-hidden">
      {/* Mobile Navigation */}
      <div className="lg:hidden flex-shrink-0">
        <TopMobileNavigation activeItem="payments" setActiveItem={() => {}} />
      </div>

      {/* Main Container - Fixed height with proper overflow */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0 px-2 sm:px-4 pt-2 pb-2">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-600/50 shadow-2xl rounded-xl w-full text-white flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header Section - Animated Hide/Show */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden border-b border-slate-700/50 ${
                isHeaderVisible
                  ? "max-h-screen opacity-100 p-3 sm:p-4"
                  : "max-h-0 opacity-0 p-0"
              }`}
            >
              {/* Title */}
              <div className="text-center mb-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  المدفوعات المعلقة
                </h2>
                <p className="text-gray-300 text-sm mt-2">
                  متابعة وإدارة المدفوعات المعلقة والمستحقات
                </p>
              </div>

              {/* Statistics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4">
                <Card className="overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-600/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-slate-500/60">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {formatNumber(allUnpaidMembers.length)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300 mt-1 font-medium">
                          إجمالي المعلقة
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/20 via-blue-500/20 to-purple-500/20 p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-white/10 shadow-lg">
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-red-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-600/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-slate-500/60">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {formatNumber(filteredMembers.length)}
                        </div>
                        <div className="text-sm text-gray-300 mt-1 font-medium">
                          المعروضة حالياً
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/20 via-blue-500/20 to-purple-500/20 p-3 sm:p-4 rounded-2xl border border-white/10 shadow-lg">
                        <Filter className="h-6 w-6 sm:h-7 sm:w-7 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-600/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-slate-500/60">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {formatNumber(
                            allUnpaidMembers.filter(
                              (m) => m.paymentStatus === "partial",
                            ).length,
                          )}
                        </div>
                        <div className="text-sm text-gray-300 mt-1 font-medium">
                          مدفوعة جزئياً
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/20 via-blue-500/20 to-purple-500/20 p-3 sm:p-4 rounded-2xl border border-white/10 shadow-lg">
                        <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-600/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-slate-500/60">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {formatNumber(
                            allUnpaidMembers.filter(
                              (m) => m.sessionsRemaining === 0,
                            ).length,
                          )}
                        </div>
                        <div className="text-sm text-gray-300 mt-1 font-medium">
                          حصص منتهية
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/20 via-blue-500/20 to-purple-500/20 p-3 sm:p-4 rounded-2xl border border-white/10 shadow-lg">
                        <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-pink-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Period Filter Buttons - Mobile Optimized */}
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 w-full">
                {/* Mobile: Grid Layout for Better Touch */}
                <div className="grid grid-cols-2 gap-2 sm:hidden">
                  <Button
                    variant="outline"
                    className={`flex items-center justify-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white py-2 px-3 rounded-lg transition-all duration-300 ${selectedPeriod === "all" ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400/50 shadow-lg" : ""}`}
                    onClick={() => setSelectedPeriod("all")}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="text-xs font-medium">الكل</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center justify-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white py-3 px-4 rounded-xl transition-all duration-300 ${selectedPeriod === "thisMonth" ? "bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/50 shadow-lg" : ""}`}
                    onClick={() => setSelectedPeriod("thisMonth")}
                  >
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">هذا الشهر</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center justify-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white py-3 px-4 rounded-xl transition-all duration-300 ${selectedPeriod === "lastMonth" ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 shadow-lg" : ""}`}
                    onClick={() => setSelectedPeriod("lastMonth")}
                  >
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium">الشهر الماضي</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center justify-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white py-3 px-4 rounded-xl transition-all duration-300 ${selectedPeriod === "expired" ? "bg-gradient-to-r from-red-500/30 to-orange-500/30 border-red-400/50 shadow-lg" : ""}`}
                    onClick={() => setSelectedPeriod("expired")}
                  >
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium">منتهية الصلاحية</span>
                  </Button>
                </div>

                {/* Desktop & Tablet: Horizontal Scroll */}
                <div className="hidden sm:flex gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white whitespace-nowrap px-4 py-2.5 rounded-xl transition-all duration-300 ${selectedPeriod === "all" ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400/50 shadow-lg" : ""}`}
                    onClick={() => setSelectedPeriod("all")}
                  >
                    <Filter className="h-4 w-4" />
                    الكل
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white whitespace-nowrap px-4 py-2.5 rounded-xl transition-all duration-300 ${selectedPeriod === "thisMonth" ? "bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/50 shadow-lg" : ""}`}
                    onClick={() => setSelectedPeriod("thisMonth")}
                  >
                    <Calendar className="h-4 w-4 text-blue-400" />
                    هذا الشهر
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white whitespace-nowrap px-4 py-2.5 rounded-xl transition-all duration-300 ${selectedPeriod === "lastMonth" ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 shadow-lg" : ""}`}
                    onClick={() => setSelectedPeriod("lastMonth")}
                  >
                    <Calendar className="h-4 w-4 text-purple-400" />
                    الشهر الماضي
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 backdrop-blur-sm bg-bluegray-700/50 border-bluegray-600 hover:bg-bluegray-600 text-white whitespace-nowrap px-4 py-2.5 rounded-xl transition-all duration-300 ${selectedPeriod === "expired" ? "bg-gradient-to-r from-red-500/30 to-orange-500/30 border-red-400/50 shadow-lg" : ""}`}
                    onClick={() => setSelectedPeriod("expired")}
                  >
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    منتهية الصلاحية
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area - Flexible */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto scrollbar-hide"
              style={{
                WebkitOverflowScrolling: "touch",
                minHeight: 0,
                touchAction: "pan-y",
                overscrollBehavior: "contain",
                height: "100%",
              }}
              onScroll={handleScroll}
              onTouchStart={() => {
                // Force blur on any focused element
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement && activeElement.blur) {
                  activeElement.blur();
                }
                // Also hide any virtual keyboards
                window.scrollTo(0, 0);
              }}
              onTouchMove={() => {
                // Additional keyboard hiding on touch move
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement && activeElement.blur) {
                  activeElement.blur();
                }
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center py-10 sm:py-20">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12 bg-bluegray-700/30 backdrop-blur-md rounded-lg">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-lg opacity-50" />
                    <div className="relative bg-gradient-to-br from-green-500/30 to-emerald-500/30 p-8 rounded-2xl mb-6 border border-green-400/20 max-w-md mx-auto">
                      <DollarSign className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                        ممتاز!
                      </h3>
                      <p className="text-green-300 text-lg mb-2">
                        {selectedPeriod === "all"
                          ? "لا توجد مدفوعات معلقة حالياً"
                          : "لا توجد مدفوعات معلقة في هذه الفترة"}
                      </p>
                      <p className="text-gray-300">
                        {selectedPeriod === "all"
                          ? "جميع الأعضاء قاموا بسداد مستحقاتهم"
                          : "جرب تغيير الفترة الزمنية للبحث"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 pb-20 lg:pb-6">
                  {filteredMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="overflow-hidden backdrop-blur-xl bg-gradient-to-br from-bluegray-700/60 to-bluegray-800/60 border border-red-500/50 shadow-lg hover:shadow-xl transition-all duration-200 w-full hover:border-red-400/60">
                        <CardContent className="p-2 sm:p-3 lg:p-4">
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2 lg:mb-3">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-2 border-red-400/50 shadow-md">
                              <AvatarImage
                                src={member.imageUrl}
                                alt={member.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-xs sm:text-sm font-semibold">
                                {member.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <h3 className="text-xs sm:text-sm lg:text-base font-semibold mb-1 text-white truncate">
                            {member.name}
                          </h3>

                          {member.phoneNumber && (
                            <div className="flex items-center gap-1 text-blue-300 mb-1.5">
                              <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span className="text-xs font-medium">
                                {member.phoneNumber}
                              </span>
                            </div>
                          )}

                          <div className="space-y-1 sm:space-y-1.5 mt-1.5 sm:mt-2">
                            {/* Sessions Remaining - Prominent Display */}
                            {member.subscriptionType &&
                              member.sessionsRemaining !== undefined && (
                                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-md p-1.5 sm:p-2 border border-blue-400/30">
                                  <div className="flex items-center justify-between">
                                    <span className="text-blue-300 text-xs font-medium">
                                      الحصص:
                                    </span>
                                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-1.5 py-0.5 font-bold">
                                      {formatNumber(member.sessionsRemaining)}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    من {member.subscriptionType.split(" ")[0]}
                                  </div>
                                </div>
                              )}

                            {/* Subscription Price */}
                            {member.subscriptionPrice && (
                              <div className="text-xs text-gray-300">
                                <span className="text-green-400 font-medium">
                                  {formatNumber(member.subscriptionPrice)} دج
                                </span>
                              </div>
                            )}

                            {/* Subscription Type */}
                            {member.subscriptionType && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-1 py-0.5">
                                {member.subscriptionType}
                              </Badge>
                            )}

                            {/* Membership Start Date */}
                            {member.membershipStartDate && (
                              <div className="text-xs text-gray-400">
                                {formatDate(member.membershipStartDate)}
                              </div>
                            )}

                            {/* Payment Status */}
                            <div className="mt-1">
                              <Badge
                                className={`text-xs px-1 py-0.5 ${
                                  member.paymentStatus === "unpaid"
                                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                    : member.paymentStatus === "partial"
                                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                      : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                }`}
                              >
                                {member.paymentStatus === "unpaid" &&
                                  "غير مدفوع"}
                                {member.paymentStatus === "partial" && "جزئي"}
                                {member.paymentStatus === "paid" && "مدفوع"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Fixed */}
      <div className="lg:hidden flex-shrink-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50">
        <MobileNavigationComponent
          activeItem="payments"
          setActiveItem={(item) => {
            if (onBack) onBack();
          }}
          onTodayAttendanceClick={() => {
            if (onBack) onBack();
          }}
          onPendingPaymentsClick={() => {}}
        />
      </div>
    </div>
  );
};

export default PendingPaymentsPage;
