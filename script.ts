/**
 * script.ts – Tableau de bord "Banque Aurora" (démonstration fictive)
 * Compilation : npx tsc script.ts --target ES2020 --strict
 */
// ===== Types =====
type TabId = "overview" | "history";
type BlockedAction = "transfer" | "withdraw";
interface Transaction {
  readonly id: number;
  readonly recipient: string;
  readonly role: string;
  readonly date: string; // AAAA-MM-JJ
  readonly amount: number; // PLN, valeur positive
}
// ===== Données fictives =====
const TOTAL_BALANCE = 70_000_000;
const CURRENCY = "PLN";
const FATHER_NAME = "Tadeusz Nowak";
const PAYMENT_DATE = "2026-10-28";
const TRANSACTIONS: readonly Transaction[] = [
  { id: 1,  recipient: "Jean-Marc Vanderberghe", role: "PDG / CEO",                          date: PAYMENT_DATE, amount: 45000 },
  { id: 2,  recipient: "Mateusz Kowalski",       role: "Directeur Général",                  date: PAYMENT_DATE, amount: 32000 },
  { id: 3,  recipient: "Chantal Dubois",         role: "Directrice des Ressources Humaines", date: PAYMENT_DATE, amount: 24000 },
  { id: 4,  recipient: "Agnieszka Wiśniewska",   role: "Chef Comptable",                     date: PAYMENT_DATE, amount: 21500 },
  { id: 5,  recipient: "Philippe Mertens",       role: "Responsable Logistique",             date: PAYMENT_DATE, amount: 18000 },
  { id: 6,  recipient: "Jan Zieliński",          role: "Superviseur de Production",          date: PAYMENT_DATE, amount: 14500 },
  { id: 7,  recipient: "Annelies Willems",       role: "Assistante Administrative",          date: PAYMENT_DATE, amount: 11000 },
  { id: 8,  recipient: "Jakub Woźniak",          role: "Technicien de Maintenance",          date: PAYMENT_DATE, amount: 9500 },
  { id: 9,  recipient: "Lucas Peeters",          role: "Agent de Sécurité Privé",            date: PAYMENT_DATE, amount: 8200 },
  { id: 10, recipient: "Karolina Kaczmarek",     role: "Préparatrice de Commandes",          date: PAYMENT_DATE, amount: 7800 },
  { id: 11, recipient: "Michel Dumont",          role: "Agent d'Entretien / Nettoyeur",      date: PAYMENT_DATE, amount: 6500 },
];
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
/** Formate un montant : 70 000 000,00 PLN (decimals = nombre de décimales). */
function formatMoney(value: number, decimals: number = 0): string {
  const nombre = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return `${nombre} ${CURRENCY}`;
}
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
// ===== Rendu =====
/** Affiche le solde (avec 2 décimales), le nombre d'employés et le total des salaires. */
function renderSummary(): void {
  getElement("#balance", HTMLElement).textContent = formatMoney(TOTAL_BALANCE, 2);
  getElement("#stat-employees", HTMLElement).textContent = String(TRANSACTIONS.length);
  getElement("#stat-total", HTMLElement).textContent = formatMoney(
    TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0)
  );
}
/** Injecte les 11 virements dans la liste de l'onglet "Historique". */
function renderTransactions(): void {
  const list = getElement("#tx-list", HTMLUListElement);
  list.replaceChildren(); // vide la liste avant de la remplir
  for (const tx of TRANSACTIONS) {
    const li = document.createElement("li");
    li.className = "tx";
 const info = document.createElement("div");
    const name = document.createElement("div");
    name.className = "tx-name";
    name.textContent = `${tx.id}. ${tx.recipient}`;
    const meta = document.createElement("div");
    meta.className = "tx-meta";
    meta.textContent = `${tx.role} · Salaire · ${formatDate(tx.date)}`;
    info.append(name, meta);
  const amount = document.createElement("div");
    amount.className = "tx-amount";
    amount.textContent = `− ${formatMoney(tx.amount)}`;
  const status = document.createElement("span");
    status.className = "tx-status status-paid";
    status.textContent = "Payé";
    li.append(info, amount, status);
    list.appendChild(li);
  }
}
// ===== Onglets =====
function isTabId(value: string | undefined): value is TabId {
  return value === "overview" || value === "history";
}
/** Affiche l'onglet demandé et masque les autres (sans rechargement). */
function switchTab(target: TabId): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    const active = btn.dataset.tab === target;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
    btn.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll<HTMLElement>(".panel").forEach((panel) => {
    const active = panel.dataset.panel === target;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  if (target === "history") {
    renderTransactions(); // rafraîchit la liste à chaque ouverture
  }
}
// ===== Alertes de blocage =====
function isBlockedAction(value: string | undefined): value is BlockedAction {
  return value === "transfer" || value === "withdraw";
}
function showBlockAlert(action: BlockedAction): void {
  getElement("#dialog-message", HTMLElement).textContent = BLOCK_MESSAGES[action];
  getElement("#block-dialog", HTMLDialogElement).showModal();
}
// ===== Initialisation =====
function init(): void {
  renderSummary();
  renderTransactions(); // la liste est prête dès le chargement
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
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
  getElement("#dialog-close", HTMLButtonElement).addEventListener("click", () => {
    getElement("#block-dialog", HTMLDialogElement).close();
  });
}

init();
