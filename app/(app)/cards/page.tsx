"use client";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthData } from "../../../lib/projection";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { AppHeader } from "../../../components/AppHeader";
import Link from "next/link";
import { CardTransaction } from "../../../lib/types";
import { getSupabase } from "../../../lib/supabaseClient";
import { formatMonth, formatMonthTitle } from "../../../utils/date";
import { BANK_OPTIONS } from "../../../utils/constants";
import { normalizeCategory } from "../../../utils/category";
import { CATEGORY_OPTIONS } from "../../../utils/constants";
import { CurrencyText } from "../../../components/format/CurrencyText";
import { LoaderInline, LoadingCard } from "../../../components/ui/loader";

export default function CardExpensesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cardMode, setCardMode] = useState<"import" | "total_only">("import");
  const [manualCardName, setManualCardName] = useState("");
  const [customCardName, setCustomCardName] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [hideNegative, setHideNegative] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate]);

  const { data, refetch, isLoading, isFetching } = useQuery({
    queryKey: ["month", month],
    queryFn: () => fetchMonthData(month),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  });

  useEffect(() => {
    async function loadMode() {
      const supabase = getSupabase();
      const { data } = await supabase.from("user_card_mode").select("mode").single();
      if (data?.mode === "import" || data?.mode === "total_only") setCardMode(data.mode);
    }
    loadMode();
  }, []);

  async function saveManualTotal() {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const user_id = auth.user?.id;
    if (!user_id) return;
    const name = manualCardName === "Outro" ? customCardName.trim() : manualCardName;
    if (!name || !manualAmount) return;
    await supabase.from("monthly_card_totals").upsert({
      user_id,
      card_name: name,
      amount_total: Number(manualAmount),
      statement_month: month
    });
    setManualCardName("");
    setCustomCardName("");
    setManualAmount("");
  }

  const transactions = useMemo(() => {
    const list = (data?.transactions || []) as CardTransaction[];
    return hideNegative ? list.filter((t) => Number(t.amount_brl) >= 0) : list;
  }, [data, hideNegative]);

  const filteredTransactions = useMemo(() => {
    if (!selectedCategory) return transactions;
    return transactions.filter(
      (t) => normalizeCategory(t.category) === selectedCategory
    );
  }, [transactions, selectedCategory]);

  const visibleTransactions = useMemo(() => {
    if (showAll) return filteredTransactions;
    return filteredTransactions.slice(0, 20);
  }, [filteredTransactions, showAll]);

  function addMonth(delta: number) {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + delta);
    setSelectedDate(d);
  }

  function startEditCategory(t: CardTransaction) {
    setEditingId(t.id);
    setEditingCategory(normalizeCategory(t.category));
  }

  function cancelEditCategory() {
    setEditingId(null);
    setEditingCategory("");
  }

  async function saveCategory(id: string) {
    const value = editingCategory.trim();
    if (!value) {
      cancelEditCategory();
      return;
    }
    setSavingCategory(true);
    const supabase = getSupabase();
    const { error } = await supabase
      .from("card_transactions")
      .update({ category: value })
      .eq("id", id);
    setSavingCategory(false);
    if (error) return;
    cancelEditCategory();
    refetch();
  }

  return (
    <main className="p-4 space-y-6">
      <AppHeader title={`Gastos do Cartão — ${formatMonthTitle(month)}`} />
      {!data && isLoading && (
        <div className="space-y-3">
          <LoadingCard />
          <LoadingCard />
          <LoaderInline />
        </div>
      )}
      {data && isFetching && (
        <div className="text-right">
          <LoaderInline label="Atualizando dados..." />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/import">
          <Button className="bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold">
            Importar fatura
          </Button>
        </Link>

        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-secondary text-secondary-foreground hover:brightness-110"
            onClick={() => addMonth(-1)}
          >
            Mês anterior
          </Button>
          <Button
            className="bg-secondary text-secondary-foreground hover:brightness-110"
            onClick={() => addMonth(1)}
          >
            Próximo mês
          </Button>
        </div>
      </div>
      

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Lançamentos do cartão
            </h2>
            {cardMode === "import" ? (
              <p className="text-sm text-muted-foreground">Edite as categorias diretamente nos itens.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Preferência atual: apenas o valor total do cartão. A categorização está desativada.</p>
            )}
          </div>
          {selectedCategory && (
            <Badge className="text-foreground">{selectedCategory}</Badge>
          )}
        </div>
        {cardMode === "import" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2 rounded-full bg-background-elevated px-3 py-2 shadow-[0_3px_8px_rgba(6,10,18,0.1)]">
            <input
              type="checkbox"
              checked={hideNegative}
              onChange={(e) => setHideNegative(e.target.checked)}
            />
            Ocultar valores negativos (pagamentos)
          </label>
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="rounded-full bg-background-subtle text-foreground px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="">Todas as categorias</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {filteredTransactions.length > 20 && (
            <Button
              className="bg-secondary text-secondary-foreground hover:brightness-110"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Mostrar menos" : "Mostrar todos"}
            </Button>
          )}
        </div>
        )}
        {cardMode === "total_only" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="text-sm text-muted-foreground">Mês da fatura</label>
              <Input type="month" value={month} onChange={(e) => setSelectedDate(new Date(e.target.value + "-01"))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Cartão</label>
              <select
                value={manualCardName}
                onChange={(e) => setManualCardName(e.target.value)}
                className="w-full rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <option value="">Selecione</option>
                {BANK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {manualCardName === "Outro" && (
                <Input className="mt-2" value={customCardName} onChange={(e) => setCustomCardName(e.target.value)} placeholder="Nome do cartão" />
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground">Valor total da fatura</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input type="number" inputMode="decimal" step="0.01" min="0" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} placeholder="Valor" className="pl-8" />
              </div>
            </div>
            <div className="sm:col-span-4">
              <Button onClick={saveManualTotal}>Salvar valor do cartão</Button>
            </div>
          </div>
        )}
        {cardMode === "import" ? (
        <div className="mt-4 space-y-2 text-sm">
          {filteredTransactions.length === 0 && <div className="text-muted-foreground">Sem lançamentos.</div>}
          {visibleTransactions.map((t: CardTransaction) => (
            <div
              key={t.id}
              className="flex flex-col gap-1 rounded-lg bg-background-elevated p-3 shadow-[0_5px_12px_rgba(6,10,18,0.14)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-foreground">
                  {t.cards?.name || "Cartão"} • {t.purchase_date}
                </div>
                <div className={`${t.amount_brl < 0 ? "text-success" : "text-danger"} font-semibold`}>
                  <CurrencyText value={Number(t.amount_brl)} />
                </div>
              </div>
              <div className="text-secondary-foreground">{t.description || "-"}</div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                {editingId === t.id ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <select
                      value={editingCategory}
                      onChange={(e) => setEditingCategory(e.target.value)}
                      className="w-full max-w-[220px] rounded-lg bg-background-subtle text-foreground px-3.5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <Button
                      className="bg-secondary text-secondary-foreground hover:brightness-110"
                      onClick={() => saveCategory(t.id)}
                      disabled={savingCategory}
                    >
                      {savingCategory ? "Salvando..." : "Salvar"}
                    </Button>
                    <button
                      type="button"
                      onClick={cancelEditCategory}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <span>
                      {normalizeCategory(t.category)}{" "}
                      {t.installment ? `• ${t.installment}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEditCategory(t)}
                      className="text-xs font-semibold text-primary hover:text-foreground transition-colors"
                    >
                      Editar categoria
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">
            O valor total informado do cartão será considerado nas despesas. Para detalhar categorias, mude para “Importar fatura (CSV)” em Preferências.
          </div>
        )}
      </Card>
    </main>
  );
}
