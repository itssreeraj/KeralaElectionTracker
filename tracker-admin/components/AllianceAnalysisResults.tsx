type AllianceBreakdown = {
  localbodyId: number;
  localbodyName: string;
  wardsWon: number;
  wardsWinnable: number;
  boothsWon: number | null;
  boothsWinnable: number | null;
};

type AllianceAnalysisResponse = {
  district: string;
  type: string;
  alliance: string;
  year: number;
  swingPercent: number;
  localbodyCount: number;
  wardsWon: number;
  wardsWinnable: number;
  boothsWon: number | null;
  boothsWinnable: number | null;
  breakdown: AllianceBreakdown[];
};

export function AllianceAnalysisResults({ result }: { result: AllianceAnalysisResponse }) {
  if (!result) return null;

  const isGE = result.year === 2019 || result.year === 2024;

  return (
    <div style={{ marginTop: 30 }}>
      {/* Summary Block */}
      <div
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>
          District {result.district} • {result.type}
        </div>

        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Alliance: {result.alliance}
        </div>

        <div style={{ fontSize: 14, opacity: 0.9 }}>
          <strong>Year:</strong> {result.year} &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Swing:</strong> {result.swingPercent}% &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Localbodies:</strong> {result.localbodyCount}
        </div>

        {/* Aggregate totals */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={summaryBoxStyle}>
            <div className="label">Wards Won</div>
            <div className="value">{result.wardsWon}</div>
          </div>

          <div style={summaryBoxStyle}>
            <div className="label">Wards Winnable</div>
            <div className="value">{result.wardsWinnable}</div>
          </div>

          {isGE && (
            <>
              <div style={summaryBoxStyle}>
                <div className="label">Booths Won</div>
                <div className="value">{result.boothsWon ?? "-"}</div>
              </div>

              <div style={summaryBoxStyle}>
                <div className="label">Booths Winnable</div>
                <div className="value">{result.boothsWinnable ?? "-"}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Localbody Breakdown Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {result.breakdown.map((b) => (
          <div
            key={b.localbodyId}
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: 16,
              boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, opacity: 0.75 }}>
                Localbody ID: {b.localbodyId}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {b.localbodyName}
              </div>
            </div>

            {/* WARD STATS */}
            <div style={{ marginBottom: 10 }}>
              <div style={metricRowStyle}>
                <span>Wards Won</span>
                <strong>{b.wardsWon}</strong>
              </div>

              <div style={metricRowStyle}>
                <span>Wards Winnable</span>
                <strong>{b.wardsWinnable}</strong>
              </div>
            </div>

            {/* BOOTH STATS (only for GE) */}
            {isGE && (
              <>
                <hr style={{ borderColor: "#1f2937", margin: "10px 0" }} />

                <div style={metricRowStyle}>
                  <span>Booths Won</span>
                  <strong>{b.boothsWon ?? "-"}</strong>
                </div>

                <div style={metricRowStyle}>
                  <span>Booths Winnable</span>
                  <strong>{b.boothsWinnable ?? "-"}</strong>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const summaryBoxStyle: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #2f3b4a",
  borderRadius: 8,
  padding: "10px 14px",
  minWidth: 120,
  textAlign: "center",
  flex: "0 0 auto",
};

const metricRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "4px 0",
  fontSize: 14,
};