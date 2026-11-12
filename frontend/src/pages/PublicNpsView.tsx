import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Star } from "lucide-react";
import { C, LOGO_URL, FONT_DISPLAY, FONT_SANS, Button, TTextArea } from "../components/ui";
import { sacApi } from "../api";

interface PublicNpsData {
  id: string;
  cliente: string;
  protocolo: string | null;
  status: string;
  nota: number | null;
}

export default function PublicNpsView({ surveyId }: { surveyId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [survey, setSurvey] = useState<PublicNpsData | null>(null);
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    sacApi
      .getPublicNps(surveyId)
      .then((data) => {
        if (!active) return;
        setSurvey(data);
        if (data.status === "Respondida") {
          setSubmitted(true);
          setNota(data.nota);
        }
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || "Não foi possível carregar esta avaliação.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [surveyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nota === null) {
      setSubmitError("Selecione uma nota de 0 a 10 para enviar.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await sacApi.respondPublicNps(surveyId, nota, comentario.trim());
      setSubmitted(true);
      setSurvey((prev) => (prev ? { ...prev, status: "Respondida", nota } : prev));
    } catch (err: any) {
      setSubmitError(err?.message || "Erro ao enviar sua avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor = (n: number) => {
    if (n <= 6) return "#DC2626";
    if (n <= 8) return "#D97706";
    return "#16A34A";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${C.bg} 0%, #EFECE6 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: FONT_SANS,
        color: C.ink,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: "#FFFFFF",
          borderRadius: 18,
          border: `1px solid ${C.border}`,
          boxShadow: "0 16px 40px rgba(24, 24, 27, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho com marca Via do Terno */}
        <div
          style={{
            background: C.wineDark,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            borderBottom: `3px solid ${C.gold}`,
          }}
        >
          <img
            src={LOGO_URL}
            alt="Via do Terno"
            style={{ height: 46, objectFit: "contain", marginBottom: 10 }}
          />
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            Pesquisa de Satisfação
          </div>
          <div style={{ color: "#CBD5E1", fontSize: 12.5, marginTop: 4 }}>
            Sua opinião nos ajuda a atender cada vez melhor
          </div>
        </div>

        <div style={{ padding: "28px 24px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "32px 0", color: C.inkSoft, fontSize: 14 }}>
              Carregando sua pesquisa de avaliação...
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: "center", padding: "24px 8px" }}>
              <AlertCircle size={42} color={C.danger} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Link indisponível
              </div>
              <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}>{error}</div>
            </div>
          )}

          {!loading && !error && survey && submitted && (
            <div style={{ textAlign: "center", padding: "20px 8px" }}>
              <CheckCircle2 size={48} color="#16A34A" style={{ marginBottom: 14 }} />
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: C.ink,
                }}
              >
                Obrigado pela sua avaliação!
              </div>
              <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.6, margin: "0 0 18px" }}>
                Olá, <strong>{survey.cliente}</strong>. Sua resposta{" "}
                {nota !== null && (
                  <>
                    (nota <strong>{nota}/10</strong>)
                  </>
                )}{" "}
                foi registrada com sucesso. A equipe Via do Terno agradece a confiança!
              </p>
              {survey.protocolo && (
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    fontSize: 12,
                    color: C.inkSoft,
                    fontWeight: 600,
                  }}
                >
                  Protocolo: {survey.protocolo}
                </div>
              )}
            </div>
          )}

          {!loading && !error && survey && !submitted && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  Olá, {survey.cliente}!
                </div>
                {survey.protocolo && (
                  <div style={{ fontSize: 12.5, color: C.inkSoft }}>
                    Referente ao atendimento <strong>{survey.protocolo}</strong>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "16px 14px",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.45,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <Star size={18} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    De 0 a 10, o quanto você recomendaria a Via do Terno para um amigo ou familiar?
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
                    gap: 5,
                    marginBottom: 8,
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const selected = nota === n;
                    const accent = scoreColor(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setNota(n);
                          setSubmitError("");
                        }}
                        style={{
                          height: 42,
                          borderRadius: 8,
                          border: selected ? `2px solid ${accent}` : `1px solid ${C.border}`,
                          background: selected ? accent : "#FFFFFF",
                          color: selected ? "#FFFFFF" : C.ink,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          padding: 0,
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11.5,
                    color: C.inkSoft,
                    fontWeight: 600,
                  }}
                >
                  <span>0 · Não recomendaria</span>
                  <span>10 · Recomendaria muito</span>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: C.ink,
                  }}
                >
                  Quer deixar algum comentário ou sugestão? (opcional)
                </label>
                <TTextArea
                  rows={3}
                  value={comentario}
                  onChange={(e: any) => setComentario(e.target.value)}
                  placeholder="Conte brevemente como foi sua experiência..."
                />
              </div>

              {submitError && (
                <div
                  style={{
                    background: "#FEF2F2",
                    color: C.danger,
                    border: "1px solid #FECACA",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={submitting || nota === null}
                style={{ width: "100%", justifyContent: "center", padding: "12px 18px", fontSize: 14.5 }}
              >
                {submitting ? "Enviando avaliação..." : "Enviar Avaliação"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 11.5, color: C.inkSoft }}>
        Via do Terno · Atendimento ao Cliente
      </div>
    </div>
  );
}
