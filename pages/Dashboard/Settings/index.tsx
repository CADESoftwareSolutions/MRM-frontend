import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Bell,
  Lock,
  Building2,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardComponents/DashboardLayout";
import { useAtom } from "jotai";
import { pageHeaderAtom } from "@/atoms/NavigationAtom";

const UserSettings = () => {
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setPageHeader({ title: "Settings" });
    return () => setPageHeader({});
  }, []);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    leaseExpirations: true,
    systemUpdates: false,
  });

  return (
    <DashboardLayout>
      <div className="px-6 pb-2 pt-20">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-purple-300/30">
            <CardContent className="p-5">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="flex w-full bg-white/5 border border-purple-300/20 rounded-xl gap-1 h-auto p-1 mb-4">
                  <TabsTrigger
                    value="profile"
                    className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-purple-100 hover:text-white hover:bg-purple-500/30 cursor-pointer transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-purple-100 hover:text-white hover:bg-purple-500/30 cursor-pointer transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-purple-100 hover:text-white hover:bg-purple-500/30 cursor-pointer transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-3 mt-0">
                  <div className="flex items-center gap-4 pb-3 border-b border-purple-300/30">
                    <div className="w-14 h-14 rounded-full bg-purple-600/30 flex items-center justify-center border-2 border-purple-300/50 flex-shrink-0">
                      <User className="w-7 h-7 text-purple-200" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm mb-1">Profile Picture</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-300/30 bg-purple-500/20 text-purple-200 hover:bg-purple-500/20 hover:text-white cursor-pointer"
                      >
                        Upload New Picture
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <Label className="text-purple-100 font-semibold mb-1 text-xs flex items-center gap-1">
                        First Name <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Input
                        placeholder="John"
                        defaultValue="John"
                        className="bg-white/5 border-purple-300/30 text-white h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-purple-100 font-semibold mb-1 text-xs flex items-center gap-1">
                        Last Name <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Input
                        placeholder="Doe"
                        defaultValue="Doe"
                        className="bg-white/5 border-purple-300/30 text-white h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-purple-100 font-semibold mb-1 text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email Address <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="john.doe@company.com"
                        defaultValue="john.doe@company.com"
                        className="bg-white/5 border-purple-300/30 text-white h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-purple-100 font-semibold mb-1 text-xs flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone Number
                      </Label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        defaultValue="(555) 123-4567"
                        className="bg-white/5 border-purple-300/30 text-white h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-purple-100 font-semibold mb-1 text-xs">Job Title</Label>
                      <Input
                        placeholder="Land Manager"
                        defaultValue="Land Manager"
                        className="bg-white/5 border-purple-300/30 text-white h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-purple-100 font-semibold mb-1 text-xs flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Company Name
                      </Label>
                      <Input
                        placeholder="Acme Energy Corporation"
                        defaultValue="Acme Energy Corporation"
                        className="bg-white/5 border-purple-300/30 text-white h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-purple-100 font-semibold mb-1 text-xs">Bio</Label>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        rows={2}
                        className="bg-white/5 border-purple-300/30 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-purple-300/30">
                    <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer">
                      <Save className="w-3 h-3 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-purple-300/30 bg-white/80 text-purple-800 hover:bg-purple-500/20 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4 mt-0">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-purple-100">Change Password</h3>
                    <div>
                      <Label className="text-purple-100 font-semibold mb-1 text-xs">Current Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-white/5 border-purple-300/30 text-white h-8 text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-100"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-purple-100 font-semibold mb-1 text-xs">New Password</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/5 border-purple-300/30 text-white h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-purple-100 font-semibold mb-1 text-xs">Confirm New Password</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/5 border-purple-300/30 text-white h-8 text-sm"
                      />
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 cursor-pointer">
                      Update Password
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-purple-300/30 space-y-2">
                    <h3 className="text-sm font-semibold text-purple-100">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-purple-300/20">
                      <div>
                        <p className="text-white font-medium text-sm">Enable 2FA</p>
                        <p className="text-xs text-purple-300">Add an extra layer of security to your account</p>
                      </div>
                      <Switch className="data-[state=checked]:bg-green-300/80 data-[state=unchecked]:bg-gray-600 cursor-pointer" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-purple-300/30 space-y-2">
                    <h3 className="text-sm font-semibold text-purple-100">Active Sessions</h3>
                    <div className="p-3 rounded-lg bg-white/5 border border-purple-300/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">Current Session</p>
                          <p className="text-xs text-purple-300">Chrome on Windows • Dallas, TX</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-200 border-green-300/30 text-xs">
                          Active Now
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-2 mt-0">
                  {[
                    { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive notifications via email" },
                    { key: "pushNotifications" as const, label: "Push Notifications", desc: "Receive push notifications on your device" },
                    { key: "weeklyReports" as const, label: "Weekly Reports", desc: "Get a summary of your activity every week" },
                    { key: "leaseExpirations" as const, label: "Lease Expiration Alerts", desc: "Notify me when leases are approaching expiration" },
                    { key: "systemUpdates" as const, label: "System Updates", desc: "Be notified about system updates and maintenance" },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-white/5 border border-purple-300/20"
                    >
                      <div>
                        <p className="text-white font-medium text-sm">{label}</p>
                        <p className="text-xs text-purple-300">{desc}</p>
                      </div>
                      <Switch
                        checked={notifications[key]}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, [key]: checked })
                        }
                        className="data-[state=checked]:bg-green-300/80 data-[state=unchecked]:bg-gray-600 cursor-pointer"
                      />
                    </div>
                  ))}

                  <div className="flex gap-3 pt-2 border-t border-purple-300/30">
                    <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer">
                      <Save className="w-3 h-3 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;
