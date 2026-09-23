import { createRoot } from "react-dom/client";
import TabsLayout from "@/app/(tabs)/layout";
import SceneLayout from "@/app/scene/[sceneId]/layout";
import { MeScreen } from "@/components/me/MeScreen";
import { PageTransition } from "@/components/nav/PageTransition";
import { Providers } from "@/components/nav/Providers";
import { PhrasebookScreen } from "@/components/phrasebook/PhrasebookScreen";
import { ReviewScreen } from "@/components/review/ReviewScreen";
import { ListenLearnScreen } from "@/components/scene/ListenLearnScreen";
import { TalkRoute } from "@/components/talk/TalkRoute";
import { TownScreen } from "@/components/town/TownScreen";
import { getScene } from "@/data/scenes";
import { useLocation } from "./router";

/** Same routes as the Next app, matched in memory. */
function Screen({ path }: { path: string }) {
  if (path === "/") return <TabsLayout><TownScreen /></TabsLayout>;
  if (path === "/phrasebook") return <TabsLayout><PhrasebookScreen /></TabsLayout>;
  if (path === "/me") return <TabsLayout><MeScreen /></TabsLayout>;

  const m = path.match(/^\/scene\/([\w-]+)(?:\/(talk|review))?$/);
  if (m && getScene(m[1])) {
    const [, id, sub] = m;
    return (
      <SceneLayout>
        {sub === "talk" ? <TalkRoute sceneId={id} /> : sub === "review" ? <ReviewScreen sceneId={id} /> : <ListenLearnScreen sceneId={id} />}
      </SceneLayout>
    );
  }
  return <TabsLayout><TownScreen /></TabsLayout>;
}

function App() {
  const { path, search } = useLocation();
  // Tabs share one chrome, so only their content transitions.
  return (
    <Providers>
      <PageTransition key={path + search}>
        <Screen path={path} />
      </PageTransition>
    </Providers>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
