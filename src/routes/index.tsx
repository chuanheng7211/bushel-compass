import { createFileRoute } from "@tanstack/react-router";
import { CompassApp } from "@/components/compass-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CompassApp />;
}
