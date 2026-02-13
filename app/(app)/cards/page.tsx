"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthData } from "../../../lib/projection";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { AppHeader } from "../../../components/AppHeader";
import Link from "next/link";
import { CardTransaction } from "../../../lib/types";
import { getSupabase } from "../../../lib/supabaseClient";
import { formatMonth, formatMonthTitle } from "../../../utils/date";
import { normalizeCategory } from "../../../utils/category";
import { CATEGORY_OPTIONS } from "../../../utils/constants";

export default function CardExpensesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hideNegative, setHideNegative] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const month = useMemo(() => formatMonth(selectedDate), [selectedDate]);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["month", month],
    queryFn: () => fetchMonthData(month),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  });

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
      {isLoading && <div>Carregando...</div>}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Lançamentos do cartão
            </h2>
            <p className="text-sm text-muted-foreground">
              Edite as categorias diretamente nos itens.
            </p>
          </div>
          {selectedCategory && (
            <Badge className="text-foreground">{selectedCategory}</Badge>
          )}
        </div>
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
                  R$ {Number(t.amount_brl).toFixed(2)}
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
      </Card>
    </main>
  );
}
