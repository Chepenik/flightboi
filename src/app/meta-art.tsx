type MetaArtProps = {
  variant: "open-graph" | "twitter";
};

const gridLines = Array.from({ length: 14 }, (_, index) => index);
const starDots = Array.from({ length: 22 }, (_, index) => index);

export function FlightBoiMetaArt({ variant }: MetaArtProps) {
  const isTwitter = variant === "twitter";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #02040b 0%, #071427 38%, #1c0826 68%, #351006 100%)",
        color: "#f7fbff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 74% 20%, rgba(255, 122, 61, 0.34), transparent 24%), radial-gradient(circle at 22% 30%, rgba(58, 214, 255, 0.28), transparent 29%), radial-gradient(circle at 55% 70%, rgba(255, 65, 170, 0.18), transparent 32%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -88,
          height: 365,
          background:
            "linear-gradient(180deg, rgba(3, 12, 24, 0.05) 0%, rgba(3, 12, 24, 0.9) 64%, #02040b 100%)",
          borderTop: "2px solid rgba(111, 226, 255, 0.42)",
        }}
      />

      {gridLines.map((line) => (
        <div
          key={`grid-x-${line}`}
          style={{
            position: "absolute",
            left: -60,
            right: -60,
            bottom: 46 + line * 23,
            height: 2,
            background: "rgba(97, 223, 255, 0.18)",
          }}
        />
      ))}

      {gridLines.map((line) => (
        <div
          key={`grid-y-${line}`}
          style={{
            position: "absolute",
            left: `${line * 8 - 6}%`,
            bottom: -56,
            width: 2,
            height: 420,
            background:
              "linear-gradient(180deg, rgba(255, 60, 184, 0.02), rgba(95, 226, 255, 0.33))",
            transform: `rotate(${line < 7 ? 12 + line * 3 : -12 - (line - 7) * 3}deg)`,
            transformOrigin: "bottom center",
          }}
        />
      ))}

      {starDots.map((dot) => (
        <div
          key={`dot-${dot}`}
          style={{
            position: "absolute",
            left: `${5 + ((dot * 41) % 91)}%`,
            top: `${5 + ((dot * 29) % 42)}%`,
            width: dot % 5 === 0 ? 5 : 3,
            height: dot % 5 === 0 ? 5 : 3,
            borderRadius: 99,
            background:
              dot % 3 === 0
                ? "rgba(255, 209, 117, 0.74)"
                : "rgba(148, 232, 255, 0.62)",
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          right: isTwitter ? 74 : 82,
          top: isTwitter ? 78 : 72,
          width: 430,
          height: 285,
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 42,
            top: 120,
            width: 360,
            height: 18,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(83, 235, 255, 0.62) 18%, rgba(255, 70, 175, 0.9) 100%)",
            borderRadius: 99,
            transform: "rotate(16deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 104,
            width: 270,
            height: 30,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(75, 217, 255, 0.26) 40%, rgba(75, 217, 255, 0.72) 100%)",
            borderRadius: 99,
            transform: "rotate(16deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 38,
            top: 72,
            width: 190,
            height: 58,
            background:
              "linear-gradient(90deg, #eafaff 0%, #76edff 45%, #ff4fb8 100%)",
            borderRadius: "80px 22px 22px 80px",
            transform: "rotate(16deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 95,
            top: 34,
            width: 156,
            height: 22,
            background: "#ffcc65",
            borderRadius: 18,
            transform: "rotate(-20deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 110,
            top: 124,
            width: 180,
            height: 24,
            background: "#61e3ff",
            borderRadius: 18,
            transform: "rotate(39deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 54,
            top: 86,
            width: 70,
            height: 22,
            background: "rgba(0, 7, 15, 0.72)",
            border: "2px solid rgba(255, 255, 255, 0.76)",
            borderRadius: 99,
            transform: "rotate(16deg)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          top: isTwitter ? 78 : 68,
          width: 650,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#99f2ff",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(153, 242, 255, 0.72)",
              borderRadius: 14,
              background: "rgba(4, 16, 28, 0.72)",
            }}
          >
            FB
          </div>
          Browser-native flight
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: isTwitter ? 88 : 96,
            lineHeight: 0.88,
            fontWeight: 900,
          }}
        >
          <span>FlightBoi</span>
          <span
            style={{
              color: "#ffcf6b",
            }}
          >
            takes off.
          </span>
        </div>

        <div
          style={{
            maxWidth: 590,
            color: "#dbe9f7",
            fontSize: 30,
            lineHeight: 1.25,
          }}
        >
          Cinematic arcade flying meets pilot familiarization, cockpit systems,
          Sky Academy lessons, and hidden neon runs.
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 10,
          }}
        >
          {["Arcade rush", "Flight Academy", "Grid Run"].map((label, index) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "12px 18px",
                border:
                  index === 2
                    ? "2px solid rgba(255, 86, 183, 0.82)"
                    : "2px solid rgba(117, 236, 255, 0.48)",
                borderRadius: 999,
                color: index === 2 ? "#ffd6ef" : "#dffaff",
                background:
                  index === 2
                    ? "rgba(255, 44, 157, 0.16)"
                    : "rgba(63, 217, 255, 0.12)",
                fontSize: 23,
                fontWeight: 700,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 46,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "rgba(232, 245, 255, 0.78)",
          fontSize: 24,
        }}
      >
        <span>Next.js 16 + Three.js + React Three Fiber</span>
        <span style={{ color: "#8df4ff" }}>fly the grid, learn the sky</span>
      </div>
    </div>
  );
}
