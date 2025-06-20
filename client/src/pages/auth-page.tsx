import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Redirect } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const loginForm = useForm<Pick<InsertUser, "username" | "password">>({
    resolver: zodResolver(
      insertUserSchema.pick({
        username: true,
        password: true,
      }),
    ),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl text-center">
              Welcome to KIRTAN UPDATE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                <TabsTrigger value="login" className="text-sm sm:text-base">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="text-sm sm:text-base">
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit((data) =>
                      loginMutation.mutate(data),
                    )}
                    className="space-y-3 sm:space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Username"
                              {...field}
                              className="h-9 sm:h-10 text-sm sm:text-base"
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                {...field}
                                className="h-9 sm:h-10 text-sm sm:text-base"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 h-9 sm:h-10 text-sm sm:text-base mt-2"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      )}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit((data) =>
                      registerMutation.mutate(data),
                    )}
                    className="space-y-3 sm:space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Name"
                              {...field}
                              className="h-9 sm:h-10 text-sm sm:text-base"
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Username"
                              {...field}
                              className="h-9 sm:h-10 text-sm sm:text-base"
                            />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={
                                  showRegisterPassword ? "text" : "password"
                                }
                                placeholder="Password"
                                {...field}
                                className="h-9 sm:h-10 text-sm sm:text-base"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() =>
                                  setShowRegisterPassword(!showRegisterPassword)
                                }
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 h-9 sm:h-10 text-sm sm:text-base mt-2"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      )}
                      Register
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div
        className="hidden md:block w-1/2 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1464207687429-7505649dae38?q=80&w=2673&auto=format&fit=crop')",
        }}
      ></div>
    </div>
  );
}
