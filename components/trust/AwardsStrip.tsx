import Image from "next/image";

const AWARDS = [
  {
    src: "/awards/readers-choice-2025.jpg",
    alt: "Star Local Media Readers' Choice 2025 – Best of McKinney, 5 Years in a Row",
    width: 80,
    height: 80,
  },
  {
    src: "/awards/best-of-mckinney-2021.png",
    alt: "Winner Best of McKINNEY online 2021",
    width: 72,
    height: 72,
  },
  {
    src: "/awards/expertise-laser-2022.jpg",
    alt: "Expertise.com Best Laser Hair Removal in Plano 2022",
    width: 80,
    height: 80,
  },
];

export default function AwardsStrip() {
  return (
    <div className="w-full space-y-2">
      <p className="label-xs text-center">Awards & Recognition</p>
      <div className="flex items-center justify-around gap-3">
        {AWARDS.map((award) => (
          <div key={award.alt} className="flex items-center justify-center">
            <Image
              src={award.src}
              alt={award.alt}
              width={award.width}
              height={award.height}
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
