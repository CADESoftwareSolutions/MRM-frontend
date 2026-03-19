import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Bell,
  Lock,
  Palette,
  Building2,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import DashboardLayout from "../../../components/DashboardComponents/DashboardLayout";

const UserSettings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    leaseExpirations: true,
    systemUpdates: false,
  });

  return (
    <DashboardLayout>
      <div
        className="min-h-screen p-6"
        style={{
          background:
            "linear-gradient(135deg, #2d1b4e 0%, #1e1e3f 50%, #2d1b4e 100%)",
          marginTop: `64px`,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-purple-300" />
              <h1 className="text-3xl font-bold text-white">Settings</h1>
            </div>
            <Badge className="bg-purple-600/30 text-purple-200 border-purple-300/30">
              Account Active
            </Badge>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-purple-900/30 mb-6">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-purple-600 text-purple-100 cursor-pointer"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-purple-600 text-purple-100 cursor-pointer"
              >
                <Lock className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-purple-600 text-purple-100 cursor-pointer"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="bg-white/10 backdrop-blur-md border-purple-300/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6 pb-6 border-b border-purple-300/30">
                    <div className="w-24 h-24 rounded-full bg-purple-600/30 flex items-center justify-center border-2 border-purple-300/50">
                      <User className="w-12 h-12 text-purple-200" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        Profile Picture
                      </h3>
                      <Button
                        variant="outline"
                        className="border-purple-300/30 bg-purple-500/20 text-purple-200 hover:bg-purple-500/20 hover:text-white cursor-pointer"
                      >
                        Upload New Picture
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm flex items-center gap-2">
                        First Name
                        <span className="text-red-500 text-base font-bold">
                          *
                        </span>
                      </Label>
                      <Input
                        placeholder="John"
                        defaultValue="John"
                        className="bg-white/5 border-purple-300/30 text-white h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm flex items-center gap-2">
                        Last Name
                        <span className="text-red-500 text-base font-bold">
                          *
                        </span>
                      </Label>
                      <Input
                        placeholder="Doe"
                        defaultValue="Doe"
                        className="bg-white/5 border-purple-300/30 text-white h-10"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                        <span className="text-red-500 text-base font-bold">
                          *
                        </span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="john.doe@company.com"
                        defaultValue="john.doe@company.com"
                        className="bg-white/5 border-purple-300/30 text-white h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        defaultValue="(555) 123-4567"
                        className="bg-white/5 border-purple-300/30 text-white h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm">
                        Job Title
                      </Label>
                      <Input
                        placeholder="Land Manager"
                        defaultValue="Land Manager"
                        className="bg-white/5 border-purple-300/30 text-white h-10"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Company Name
                      </Label>
                      <Input
                        placeholder="Acme Energy Corporation"
                        defaultValue="Acme Energy Corporation"
                        className="bg-white/5 border-purple-300/30 text-white h-10"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm">
                        Bio
                      </Label>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="bg-white/5 border-purple-300/30 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-purple-300/30">
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-purple-300/30 bg-white/80 text-purple-800 hover:bg-purple-500/20 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="bg-white/10 backdrop-blur-md border-purple-300/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Manage your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold text-purple-100">
                      Change Password
                    </h3>

                    <div>
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-white/5 border-purple-300/30 text-white h-10 pr-10"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-100"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm">
                        New Password
                      </Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/5 border-purple-300/30 text-white h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-purple-100 font-semibold mb-2.5 text-sm">
                        Confirm New Password
                      </Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/5 border-purple-300/30 text-white h-10"
                      />
                    </div>

                    <Button className="bg-purple-600 hover:bg-purple-700 cursor-pointer">
                      Update Password
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-purple-300/30 space-y-4">
                    <h3 className="text-lg font-semibold text-purple-100">
                      Two-Factor Authentication
                    </h3>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-purple-300/20">
                      <div>
                        <p className="text-white font-medium">Enable 2FA</p>
                        <p className="text-sm text-purple-300">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch className="data-[state=checked]:bg-green-300/80 data-[state=unchecked]:bg-gray-600 cursor-pointer" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-purple-300/30 space-y-4">
                    <h3 className="text-lg font-semibold text-purple-100">
                      Active Sessions
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-white/5 border border-purple-300/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">
                              Current Session
                            </p>
                            <p className="text-sm text-purple-300">
                              Chrome on Windows • Dallas, TX
                            </p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-200 border-green-300/30">
                            Active Now
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="bg-white/10 backdrop-blur-md border-purple-300/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-purple-300/20">
                      <div>
                        <p className="text-white font-medium">
                          Email Notifications
                        </p>
                        <p className="text-sm text-purple-300">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            emailNotifications: checked,
                          })
                        }
                        className="data-[state=checked]:bg-green-300/80 data-[state=unchecked]:bg-gray-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-purple-300/20">
                      <div>
                        <p className="text-white font-medium">
                          Push Notifications
                        </p>
                        <p className="text-sm text-purple-300">
                          Receive push notifications on your device
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            pushNotifications: checked,
                          })
                        }
                        className="data-[state=checked]:bg-green-300/80 data-[state=unchecked]:bg-gray-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-purple-300/20">
                      <div>
                        <p className="text-white font-medium">Weekly Reports</p>
                        <p className="text-sm text-purple-300">
                          Get a summary of your activity every week
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            weeklyReports: checked,
                          })
                        }
                        className="data-[state=checked]:bg-green-300/80 data-[state=unchecked]:bg-gray-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-purple-300/20">
                      <div>
                        <p className="text-white font-medium">
                          Lease Expiration Alerts
                        </p>
                        <p className="text-sm text-purple-300">
                          Notify me when leases are approaching expiration
                        </p>
                      </div>
                      <Switch
                        checked={notifications.leaseExpirations}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            leaseExpirations: checked,
                          })
                        }
                        className="data-[state=checked]:bg-green-300/80 data-[state=unchecked]:bg-gray-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-purple-300/20">
                      <div>
                        <p className="text-white font-medium">System Updates</p>
                        <p className="text-sm text-purple-300">
                          Be notified about system updates and maintenance
                        </p>
                      </div>
                      <Switch
                        checked={notifications.systemUpdates}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            systemUpdates: checked,
                          })
                        }
                        className="data-[state=checked]:bg-green-300/80 data-[state=unchecked]:bg-gray-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-purple-300/30">
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer">
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;
