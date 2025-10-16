import { Stack } from "expo-router/stack";
import { useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function Layout() {
  const { isSignedIn } = useUser();

  if (!isSignedIn) return <Redirect href={"/sign-in"} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
