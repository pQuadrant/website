import { BottomLeftCluster } from "@/components/chrome/BottomLeftCluster";
import { BottomRightCluster } from "@/components/chrome/BottomRightCluster";
import { TopLeftCluster } from "@/components/chrome/TopLeftCluster";
import { TopRightCluster } from "@/components/chrome/TopRightCluster";
import { Globe } from "@/components/globe/Globe";
import { Stage } from "@/components/stage/Stage";
import { Starfield } from "@/components/starfield/Starfield";
import { homeContent } from "@/content/home";

export default function HomePage() {
  const { chrome } = homeContent;

  return (
    <Stage
      starfield={<Starfield />}
      motif={<Globe />}
      topLeft={<TopLeftCluster content={chrome.topLeft} />}
      topRight={<TopRightCluster content={chrome.topRight} />}
      bottomLeft={<BottomLeftCluster content={chrome.bottomLeft} />}
      bottomRight={<BottomRightCluster content={chrome.bottomRight} />}
    />
  );
}
