/**
 * script.ts – Tableau de bord "Banque Aurora" (démonstration fictive)
 * Compilation : npx tsc script.ts --target ES2020 --strict
 */
// ===== Types =====
type TabId = "overview" | "history";
type TxStatus = "paid" | "pending" | "blocked";
type BlockedAction = "transfer" | "withdraw";
interface Transaction {
  readonly id: number;
  readonly label: string;
  readonly recipient: string;
  readonly date: string;
  readonly amount: number;
  readonly status: TxStatus;
}
// ===== Données fictives =====
const TOTAL_BALANCE = 70_000_000;
const CURRENCY = "PLN";
const FATHER_NAME = "Tadeusz Nowak";
const TRANSACTIONS: readonly Transaction[] = [
  { id: 1, label: "Salaire octobre", recipient: "Marek Kowalski (chef d'atelier)", date: "2026-10-28", amount: 4200, status: "pending" },
  { id: 2, label: "Salaire octobre", recipient: "Ewa Zielińska (comptable)", date: "2026-10-28", amount: 5100, status: "pending" },
  { id: 3, label: "Prime de fin de contrat", recipient: "Piotr Wiśniewski (chauffeur)", date: "2026-10-30", amount: 2800, status: "blocked" },
  { id: 4, label: "Indemnité de licenciement", recipient: "Anna Lewandowska (assistante)", date: "2026-10-30", amount: 9600, status: "pending" },
  { id: 5, label: "Salaire septembre", recipient: "Marek Kowalski (chef d'atelier)", date: "2026-09-28", amount: 4200, status: "paid" },
  { id: 6, label: "Salaire septembre", recipient: "Ewa Zielińska (comptable)", date: "2026-09-28", amount: 5100, status: "paid" },
];
const STATUS_LABELS: Record<TxStatus, string> = {
  paid: "Payé",
  pending: "En attente",
  blocked: "Bloqué",
};
const BLOCK_MESSAGES: Record<BlockedAction, string> = {
  transfer:
    `Un nouveau virement est impossible : ce compte de succession est gelé tant que les employés de ${FATHER_NAME} n'ont pas été intégralement payés.`,
  withdraw:
    `Le retrait est impossible : ce compte de succession est gelé afin de protéger les salaires et indemnités dus aux employés de ${FATHER_NAME}.`,
};
// ===== Utilitaires =====
/** Récupère un élément du DOM avec un type strict, ou lève une erreur claire. */
function getElement<T extends HTMLElement>(selector: string, type: new () => T): T {
  const el = document.querySelector(selector);
  if (!(el instanceof type)) {
    throw new Error(`Élément introuvable ou de mauvais type : ${selector}`);
  }
  return el;
}
const formatMoney = (value: number): string =>
  `${new Intl.NumberFormat("fr-FR").format(value)} ${CURRENCY}`;
const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(iso));
// ===== Références DOM =====
const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab"));
const panels = Array.from(document.querySelectorAll<HTMLElement>(".panel"));
const balanceEl = getElement("#balance", HTMLElement);
const employeesEl = getElement("#stat-employees", HTMLElement);
const pendingEl = getElement("#stat-pending", HTMLElement);
const txListEl = getElement("#tx-list", HTMLUListElement);
const dialogEl = getElement("#block-dialog", HTMLDialogElement);
const dialogMsgEl = getElement("#dialog-message", HTMLElement);
const dialogCloseBtn = getElement("#dialog-close", HTMLButtonElement);
// ===== Onglets =====
/** Affiche l'onglet demandé et masque les autres (sans rechargement). */
function switchTab(target: TabId): void {
  tabButtons.forEach((btn) => {
    const active = btn.dataset.tab === target;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
    btn.tabIndex = active ? 0 : -1;
  });
  panels.forEach((panel) => {
    const active = panel.dataset.panel === target;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
}
function isTabId(value: string | undefined): value is TabId {
  return value === "overview" || value === "history";
}
// ===== Rendu =====
function renderSummary(): void {
  balanceEl.textContent = formatMoney(TOTAL_BALANCE);
  const pending = TRANSACTIONS.filter((t) => t.status !== "paid");
  const employees = new Set(TRANSACTIONS.map((t) => t.recipient));
  employeesEl.textContent = String(employees.size);
  pendingEl.textContent = formatMoney(pending.reduce((sum, t) => sum + t.amount, 0));
}
function renderTransactions(): void {
  txListEl.replaceChildren(); // vide la liste
  for (const tx of TRANSACTIONS) {
    const li = document.createElement("li");
    li.className = "tx";
 const info = document.createElement("div");
    const name = document.createElement("div");
    name.className = "tx-name";
    name.textContent = tx.recipient; // textContent : pas d'injection HTML
    const meta = document.createElement("div");
    meta.className = "tx-meta";
    meta.textContent = `${tx.label} · ${formatDate(tx.date)}`;
    info.append(name, meta);
  const amount = document.createElement("div");
    amount.className = "tx-amount";
    amount.textContent = `− ${formatMoney(tx.amount)}`;
   const status = document.createElement("span");
    status.className = `tx-status status-${tx.status}`;
    status.textContent = STATUS_LABELS[tx.status];
 li.append(info, amount, status);
    txListEl.appendChild(li);
  }
}
// ===== Alertes de blocage =====
function showBlockAlert(action: BlockedAction): void {
  dialogMsgEl.textContent = BLOCK_MESSAGES[action];
  dialogEl.showModal();
}
function isBlockedAction(value: string | undefined): value is BlockedAction {
  return value === "transfer" || value === "withdraw";
}
// ===== Initialisation =====
function init(): void {
  renderSummary();
  renderTransactions();
 tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.tab;
      if (isTabId(id)) switchTab(id);
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (isBlockedAction(action)) showBlockAlert(action);
    });
  });
 dialogCloseBtn.addEventListener("click", () => dialogEl.close());
}
init();
